const path = require("path");
const url = require("url");

const { send, createError } = require("micro");
const get = require("micro-get");
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

let allowedBuckets = process.env.TARGET_BUCKETS.split(",");

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
    newPath = path.join(newPath, "index.html");
  }

  return newPath;
}

module.exports = handleErrors(
  get(async (req, res) => {
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
          const data = await bucket.file(filePath).download();
          return send(res, 200, data.toString());
        }
      } else {
        return send(res, 403, forbiddenString);
      }
    }

    send(res, 404, notFoundString);
  })
);
