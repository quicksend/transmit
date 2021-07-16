import express from "express";
import fs from "fs";
import request from "supertest";
import sharp from "sharp";

import { DiskManager, Transmit } from "../../src";

import { createTmpDirectory } from "../utils/create-tmp-dir.util";
import { FixtureSizes, getFixture } from "../utils/get-fixture.util";

const TEMP_DIRECTORY = createTmpDirectory();

describe("Express and Sharp integration", () => {
  afterAll(() => fs.rmSync(TEMP_DIRECTORY, { force: true, recursive: true }));

  it("should resize the image with sharp", async (done) => {
    const app = express();

    app.post("/upload", (req, res, next) => {
      const transmit = new Transmit({
        field: "image",
        filter: (file) => /^image/.test(file.mimetype),
        manager: new DiskManager({
          directory: TEMP_DIRECTORY
        }),
        transformers: [() => sharp().resize(256, 256).png()]
      });

      transmit
        .parseAsync(req)
        .then((results) => res.send(results))
        .catch((error) => next(error));
    });

    const server = app.listen();

    const response = await request(server)
      .post("/upload")
      .attach("image", getFixture("IMAGE", "png"))
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        fields: [],
        files: [
          expect.objectContaining({
            encoding: expect.any(String),
            field: "image",
            hash: expect.any(String),
            id: expect.any(String),
            mimetype: expect.any(String),
            name: "image.png",
            size: expect.any(Number)
          })
        ]
      })
    );

    // If the image was resized, the file size should be less than the original
    expect(response.body.files[0].size).toBeLessThan(FixtureSizes.IMAGE);

    server.close(done);
  });
});
