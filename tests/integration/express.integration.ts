import express from "express";
import fs from "fs";
import request from "supertest";

import { DiskManager, Transmit } from "../../src";

import { createTmpDirectory } from "../utils/create-tmp-dir.util";
import { FixtureSizes, getFixture } from "../utils/get-fixture.util";

const TEMP_DIRECTORY = createTmpDirectory();

describe("Express integration", () => {
  afterAll(() => fs.rmSync(TEMP_DIRECTORY, { force: true, recursive: true }));

  it("should work with express", async (done) => {
    const app = express();

    app.post("/upload", (req, res, next) => {
      const transmit = new Transmit({
        manager: new DiskManager({
          directory: TEMP_DIRECTORY
        }),
        maxFiles: 2
      });

      transmit
        .parseAsync(req)
        .then((results) => res.send(results))
        .catch((error) => next(error));
    });

    const server = app.listen();

    const response = await request(server)
      .post("/upload")
      .attach("file", getFixture("SMALL"))
      .attach("file", getFixture("MEDIUM"))
      .field("hello", "world")
      .field("goodbye", "world")
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        fields: [
          expect.objectContaining({
            name: "hello",
            value: "world"
          }),
          expect.objectContaining({
            name: "goodbye",
            value: "world"
          })
        ],
        files: [
          expect.objectContaining({
            encoding: expect.any(String),
            field: "file",
            hash: expect.any(String),
            id: expect.any(String),
            mimetype: expect.any(String),
            name: "small.dat",
            size: FixtureSizes.SMALL
          }),
          expect.objectContaining({
            encoding: expect.any(String),
            field: "file",
            hash: expect.any(String),
            id: expect.any(String),
            mimetype: expect.any(String),
            name: "medium.dat",
            size: FixtureSizes.MEDIUM
          })
        ]
      })
    );

    server.close(done);
  });
});
