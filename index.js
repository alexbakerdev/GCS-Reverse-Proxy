const path = require("path");
const url = require("url");

const { send, createError } = require("micro");
const get = function(fn) {
  return (req, res) => {
    res.setHeader('Access-Control-Request-Method', 'GET')
    const {method} = req
    if (method !== 'GET') {
      res.writeHead(405)
      res.end('Method Not Allowed')
      return
    }
    return fn(req, res)
  }
}

const compress = require("micro-compress");

const gcs = require("@google-cloud/storage");

const Storage = gcs();
const bucketRef = {};

const bucketPathRegexp = /^\/([^ \/]+)\/(.*)$/;

const notFoundString = "404 Not Found";
const forbiddenString = "Forbidden";
const internalErrorString = "Internal Server Error";

if (
  !process.env.TARGET_BUCKETS ||
  typeof process.env.TARGET_BUCKETS !== "string"
) {
  throw new Error(
    "Invalid TARGET_BUCKETS env var, expected comma separated list of buckets"
  );
}

const allowedBuckets = process.env.TARGET_BUCKETS.split(",");
const historyMode =
  process.env.HISTORY && process.env.HISTORY.toLowerCase() === "true";
const singleBucket = allowedBuckets.length === 1;

const handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    console.log(err.stack);

    if (err.name === "ApiError") {
      return send(res, 404, notFoundString);
    }

    if (!err.statusCode) {
      return send(res, 500, internalErrorString);
    }
  }
};

function urlPathToFsPath(p) {
  let newPath = url.parse(p).pathname;
  newPath = decodeURI(newPath);

  const parsedPath = path.parse(newPath);

  // handle paths ending with / or without an extension
  // as directories, and map to an index.html
  if (parsedPath.ext === "") {
    if (historyMode) {
      return "index.html";
    }
    return path.join(newPath, "index.html");
  }

  return newPath;
}

module.exports = compress(
  handleErrors(
    get(async (req, res) => {
      if (singleBucket) {
        return handleSingleBucket(req, res);
      } else {
        return handleMultiBucket(req, res);
      }
    })
  )
);

async function sendFile(res, bucket, filePath) {
  const file = bucket.file(filePath);
  const [meta] = await file.getMetadata();

  res.setHeader("Content-Type", meta.contentType);
  res.setHeader("Content-Length", meta.size);
  // res.setHeader("Content-Encoding", meta.contentEncoding);
  // use streams if >~ 2MB/s to lower memory usage.
  if (meta.size > 2000000) {
    send(res, 200, file.createReadStream({ gzip: true }));
    return;
  }

  // downloading seems like a faster method.
  send(res, 200, (await file.download())[0]);
  return;
}

async function handleSingleBucket(req, res) {
  const filePath = urlPathToFsPath(req.url);
  const bucketName = allowedBuckets[0];

  if (!bucketRef[bucketName]) {
    bucketRef[bucketName] = await Storage.bucket(bucketName);
  }

  const bucket = bucketRef[bucketName];

  return sendFile(res, bucket, filePath);
}

async function handleMultiBucket(req, res) {
  const matches = bucketPathRegexp.exec(req.url);

  if (matches) {
    const bucketName = matches[1];
    if (allowedBuckets.includes(bucketName)) {
      let filePath = urlPathToFsPath(matches[2]);

      if (!bucketRef[bucketName]) {
        bucketRef[bucketName] = await Storage.bucket(bucketName);
      }

      const bucket = bucketRef[bucketName];
      if (bucket) {
        return sendFile(res, bucket, filePath);
      }
    } else {
      return send(res, 403, forbiddenString);
    }
  }
}
