# Transmit

An alternative to [Multer](https://github.com/expressjs/multer) for handling multipart/form-data 

## Why?

[Multer](https://github.com/expressjs/multer) and many other multipart/form-data parsers don't remove uploaded files if the request is aborted (without hacky solutions). Transmit uses [Busboy](https://github.com/mscdex/busboy), which wraps its functionality into a promise, making it more straightforward to use in most scenarios.

## Prerequisites
 - [Node.js](https://nodejs.org/en/) >= v15.5 (to be changed)

## Installation

```bash
$ npm install @quicksend/transmit
```

## Usage

Usage with express:

```js
const { Transmit } = require("@quicksend/transmit");

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
    .catch(error => next(error));
}

app.post("/upload", upload({ minFields: 1 }), (req, res, next) => {
  const textFields = req.fields; // An array of text fields
  const files = req.files; // An array of files
});
```

Usage with NestJS:

Use [nestjs-transmit](https://github.com/quicksend/nestjs-transmit)

```bash
$ npm install @quicksend/nestjs-transmit
```

## API

```js
// TODO: Add documentation
```

## Custom transmit managers

```js
// TODO: Add documentation
```

## Todo

[ ] Add unit tests  
[ ] Add integration tests  
[ ] Documentation
