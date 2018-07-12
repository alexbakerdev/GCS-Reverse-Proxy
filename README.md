# Google Cloud Storage Reverse Proxy

A google cloud storage reverse proxy. For hosting private static sites using private google cloud storage objects.

### Motivation

You want to serve static sites using your gcs buckets, but you want to restrict access to them.

This reverse proxy micro service will behave as a simple http server for an array of gcs buckets. Then you can use any appropriate method to restrict access to it. E.g. Putting it behind nginx, caddy or a vpn.

#### Wait why do I need this?

Accessing private gcs objects via the browser requires special tokens that are encoded into the url. This will break most (if not all) static sites, since they can't generate these tokens or predict the uri of any assets it requests or links to. However making a storage object public means there is no way to restrict access to it.

This reverse proxy will serve a private object over http at the expected (relative), uri and won't restrict access to these objects at all. However, by putting this server behind another reverse proxy, such as nginx or putting it on a vpn, you'll be able to control access in a way that bests suits your needs.

## Getting Started

### Prerequisites

- node lts/carbon
- google cloud bucket
- google cloud authenticated machine - Make sure the host machine is authenticated with gcloud, and setup with the correct project.

> N.B. (If you have the gcloud sdk installed run `gcloud info` in your shell to check you are logged in, and have the correct project id set).

#### Environment

the `TARGET_BUCKETS` env var expects a comma separated list of buckets, e.g:

```
TARGET_BUCKETS='bucket-one,bucket-two'
```

The server will throw unless one or more TARGET_BUCKETS are defined.

Setting the `HISTORY` env var to true will start the server in history mode, for better SPA support. It will respond with the buckets root `index.html` file for any path that doesn't have a file extension.

### Run

```
npm install
TARGET_BUCKETS="bucket-name" npm start
```

### Usage

Once the server is up and running, to access a private object in a bucket should make a get request to:

```
<proxy-host>:<proxy-port>/<bucket-name>/<file-path>
```

If the file path exists in the bucket, and the server has premission to read it, the reverse proxy will send its contents as a response. If for any reason the file is not retrievable from the bucket then the server will return a 404.

If the bucket requested is not in the list of TARGET_BUCKETS then it will return a 403, regardless of its a real bucket or not.

Only the get request method is supported currently.

#### Single Bucket Mode

Having a single bucket mode means there is no need to prefix all requests with a bucket-name path, so requesting `<proxy-host>:<proxy-port>/<file-path>` will request file path from the single target bucket.

### Dev

This project uses [micro](https://github.com/zeit/micro), which means we get to use the excellent [micro-dev](https://github.com/zeit/micro-dev) tools, in development.

```
TARGET_BUCKETS="bucket-name" npm run dev
```

### Authentication in Production

> ADC uses the default service account that Compute Engine, Kubernetes Engine, App Engine, and Cloud Functions provide, for applications that run on those services.

From [Setting Up Authentication for Server to Server Production Applications](https://cloud.google.com/docs/authentication/production)

Because of the above, I recommend you use Compute Engine, Kubernetes Engine or App Engine where the authentication will be handled for you.

### Docker

I've supplied a dockerfile for getting started without needing to install node. This will not work locally as it does not setup any authentication with google cloud sdk.

However when deployed to a compute engine VM instance authentication is handled for you. To see how to deploy a Docker image on a vm instance, check out [this guide](https://cloud.google.com/compute/docs/containers/deploying-containers). Don't forget to set the `TARGET_BUCKETS` environment variable, which can be done by following [this guide](https://cloud.google.com/compute/docs/containers/configuring-options-to-run-containers#setting_environment_variables).
