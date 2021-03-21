# Transmit

An alternative to [Multer](https://github.com/expressjs/multer) for handling multipart/form-data 

## Why?

[Multer](https://github.com/expressjs/multer) and many other multipart/form-data parsers don"t remove uploaded files if the request is aborted (without hacky solutions). It also offers a modern API, making use of promises.

## Prerequisites
 - [Node.js](https://nodejs.org/en/) >= v12.21.0

## Installation

```bash
$ npm install @quicksend/transmit
```

## Usage

By default, all files are saved within the `os.tmpdir()` folder. You can change this by specifying the directory in the options of `DiskManager`.

Example with Express using a custom upload destination:
```js
const { DiskManager, Transmit } = require("@quicksend/transmit");

const express = require("express");

const app = express();

// Implement transmit as an express middleware
const upload = (options = {}) => (req, _res, next) => {
  return new Transmit(options)
    .parseAsync(req)
    .then((results) => {
      req.fields = results.fields;
      req.files = results.files;

      next();
    })
    .catch((error) => next(error));
};

const manager = new DiskManager({
  directory: "./uploads"
});

app.post("/upload", upload({ manager }), (req, res) => {
  res.send({
    fields: req.fields,
    files: req.files
  });
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
```

Example with Node.js http module:
```js
const { Transmit } = require("@quicksend/transmit");

const http = require("http");

const server = http.createServer(async (req, res) => {
  if (req.url !== "/upload" || req.method.toLowerCase() !== "post") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found." }));

    return;
  }

  try {
    const results = await new Transmit().parseAsync(req);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(results, null, 2));
  } catch (error) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(error));
  }
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});
```

## NestJS

Transmit can be used with NestJS. Install [nestjs-transmit](https://github.com/quicksend/nestjs-transmit) and follow the instructions on the README.

```bash
$ npm install @quicksend/nestjs-transmit
```

## Transformers

Files can be transformed before it is written to the storage medium. A use case would be resizing uploaded images

Transformers will run sequentially in the order that they were placed.

Example with [sharp](https://github.com/lovell/sharp) as a resize transformer
```js
const { DiskManager, Transmit } = require("@quicksend/transmit");

const express = require("express");
const sharp = require("sharp");

const app = express();

// Implement transmit as an express middleware
const upload = (options = {}) => (req, _res, next) => {
  return new Transmit(options)
    .parseAsync(req)
    .then((results) => {
      req.fields = results.fields;
      req.files = results.files;

      next();
    })
    .catch((error) => next(error));
};

const manager = new DiskManager({
  directory: "./uploads"
});

app.post(
  "/upload",
  upload({
    filter: (file) => /^image/.test(file.mimetype), // ignore any files that are not images
    manager,
    transformers: [() => sharp().resize(128, 128).png()], // resize any incoming image to 128x128 and save it as a png
  }),
  (req, res) => {
    res.send({
      fields: req.fields,
      files: req.files
    });
  }
);

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
```

## Custom transmit managers

You can create your own transmit managers. All managers must implement the [TransmitManager](https://quicksend.github.io/transmit/interfaces/transmitmanager.html) interface.

```ts
import { IncomingFile, TransmitManager } from "@quicksend/transmit";

export class MyTransmitManager implements TransmitManager {
  createWritableStream(file: IncomingFile) {
    // must return a writable stream
  }

  deleteFile(file: IncomingFile) {
    // must return void
  }
}
```