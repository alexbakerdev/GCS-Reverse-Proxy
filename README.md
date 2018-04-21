# Google Cloud Storage Reverse Proxy

A google cloud storage reverse proxy. For hosting private static sites using private google cloud storage objects.

### Motivation

I wanted to be able to serve private static sites from private objects in gcs buckets. This enables us to host sensitive company information, such as code documentation, and restrict access as needed using other tools, such as nginx, caddy or a vpn.

## Getting Started

### Prerequisites

* node lts/carbon
* google cloud bucket

Make sure the host machine is authenticated with gcloud, and setup with the correct project. (if using your development machine, run `gcloud info` in your shell to check you are logged in, and have the correct project id set)

#### Environment

the `TARGET_BUCKETS` env var expects a comma separated list of buckets, e.g:
```
TARGET_BUCKETS='bucket-one,bucket-two'
```

The server will throw unless one or more TARGET_BUCKETS are defined. 

### Run

```
nvm use
npm install
TARGET_BUCKETS="bucket-name" npm start
```

### Dev

This project uses [micro](https://github.com/zeit/micro), which means we get to use the excellent [micro-dev](https://github.com/zeit/micro-dev) tools, in development.

```
TARGET_BUCKETS="bucket-name" npm run dev
```

### Docker 

I've supplied a dockerfile for getting started without needing to install node.

### Authentication in Production

> ADC uses the default service account that Compute Engine, Kubernetes Engine, App Engine, and Cloud Functions provide, for applications that run on those services.

From [Setting Up Authentication for Server to Server Production Applications](https://cloud.google.com/docs/authentication/production)

Because of the above, I recommend you use Compute Engine, Kubernetes Engine or App Engine where the authentication will be handled for you.
