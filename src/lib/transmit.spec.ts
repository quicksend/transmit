import http from "http";
import os from "os";

import Busboy from "busboy";
import request from "supertest";

import { DiskManager, Transmit, TransmitOptions } from "..";

import {
  FieldNameTooLargeException,
  FieldValueTooLargeException,
  FileTooLargeException,
  FileTooSmallException,
  NotEnoughFieldsException,
  NotEnoughFilesException,
  TooManyFieldsException,
  TooManyFilesException,
  TooManyPartsException,
  UnsupportedContentTypeException
} from "..";

const TRANSMIT_OPTIONS: TransmitOptions = {
  field: undefined,
  filter: undefined,
  hashAlgorithm: "md5",
  manager: new DiskManager({
    directory: os.tmpdir()
  }),
  maxFieldNameSize: Infinity,
  maxFieldValueSize: Infinity,
  maxFields: Infinity,
  maxFileSize: Infinity,
  maxFiles: Infinity,
  maxHeaderPairs: Infinity,
  maxParts: Infinity,
  minFields: 0,
  minFileSize: 0,
  minFiles: 0,
  transformers: [],
  truncateFieldNames: false,
  truncateFieldValues: false
};

const createTestServer = (listener: http.RequestListener): Promise<http.Server> => {
  return new Promise((resolve) => {
    const server = http.createServer(listener);

    server.listen(() => resolve(server));
  });
};

describe("Transmit", () => {
  it("should be defined", () => {
    expect(Transmit).toBeDefined();
  });

  it("should return an instance of Busboy", async (done) => {
    const server = await createTestServer((req) => {
      const busboy = new Transmit(TRANSMIT_OPTIONS).parse(req);

      try {
        expect(busboy).toBeInstanceOf(Busboy);

        done();
      } catch (error) {
        done(error);
      }
    });

    await request(server).post("/").attach("file", Buffer.from([]), "test.txt");
  });

  it("should throw error on unsupported content type", async (done) => {
    const server = await createTestServer((req) => {
      try {
        expect(() => new Transmit(TRANSMIT_OPTIONS).parse(req)).toThrow(
          new UnsupportedContentTypeException()
        );

        done();
      } catch (error) {
        done(error);
      }
    });

    await request(server).post("/");
  });

  it("should emit 'finished' with file metadata", async (done) => {
    const field = "file";
    const filename = "test.txt";

    const server = await createTestServer((req) => {
      const transmit = new Transmit(TRANSMIT_OPTIONS);

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).not.toBeCalled();

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).toHaveBeenCalledTimes(1);
          expect(finishCallback).toBeCalledWith(
            [
              expect.objectContaining({
                field,
                name: filename
              })
            ],
            []
          );

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").attach(field, Buffer.from([]), filename);
  });

  it("should ignore files without filename", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit(TRANSMIT_OPTIONS);

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).not.toBeCalled();

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).toBeCalledWith([], []);

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").attach("file", Buffer.from([]));
  });

  it("should ignore files with incorrect field", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        field: "file"
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).not.toBeCalled();

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).toBeCalledWith([], []);

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").attach("not_file", Buffer.from([]), "text.txt");
  });

  it("should ignore file if filter returns false", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        filter: () => Promise.resolve(false)
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).not.toBeCalled();

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).toBeCalledWith([], []);

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").attach("file", Buffer.from([]), "test.txt");
  });

  it("should emit 'aborted' with no error on request abort", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit(TRANSMIT_OPTIONS);

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(undefined);

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);

      req.emit("aborted");
    });

    await request(server).post("/").attach("file", Buffer.from([]), "test.txt");
  });

  // TODO: assumes utf-8
  it("should emit 'aborted' with error when field name is too large", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        maxFieldNameSize: 1
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new FieldNameTooLargeException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").field("hello", "world");
  });

  it("should emit 'aborted' with error when field value size is too large", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        maxFieldValueSize: 1
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new FieldValueTooLargeException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").field("hello", "world");
  });

  it("should emit 'aborted' with error when there are too many fields", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        maxFields: 1
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new TooManyFieldsException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").field("hello", "world").field("goodbye", "world");
  });

  it("should emit 'aborted' with error when file is too large", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        maxFileSize: 1
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new FileTooLargeException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").attach("file", Buffer.from("contents"), "test.txt");
  });

  it("should emit 'aborted' with error when there are too many files", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        maxFiles: 1
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new TooManyFilesException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server)
      .post("/")
      .attach("first", Buffer.from("hello"), "first.txt")
      .attach("second", Buffer.from("world"), "second.txt");
  });

  it("should emit 'aborted' with error when there are too many parts", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        maxParts: 1
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new TooManyPartsException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server)
      .post("/")
      .attach("first", Buffer.from("goodbye"), "first.txt")
      .attach("second", Buffer.from("world"), "second.txt");
  });

  it("should emit 'aborted' with error when there are not enough fields", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        minFields: 2
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new NotEnoughFieldsException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").field("hello", "world");
  });

  it("should emit 'aborted' with error when the file is too small", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        minFileSize: "hello".length
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new FileTooSmallException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").attach("file", Buffer.from("bye"), "test.txt");
  });

  it("should emit 'aborted' with error when there are not enough files", async (done) => {
    const server = await createTestServer((req) => {
      const transmit = new Transmit({
        ...TRANSMIT_OPTIONS,
        minFiles: 2
      });

      const abortCallback = jest.fn();
      const doneCallback = jest.fn();
      const finishCallback = jest.fn();

      doneCallback.mockImplementation(() => {
        try {
          expect(abortCallback).toHaveBeenCalledTimes(1);
          expect(abortCallback).toBeCalledWith(
            expect.objectContaining(new NotEnoughFilesException())
          );

          expect(doneCallback).toHaveBeenCalledTimes(1);
          expect(doneCallback).toBeCalledWith();

          expect(finishCallback).not.toBeCalled();

          done();
        } catch (error) {
          done(error);
        }
      });

      transmit.on("aborted", abortCallback);
      transmit.on("done", doneCallback);
      transmit.on("finished", finishCallback);

      transmit.parse(req);
    });

    await request(server).post("/").attach("file", Buffer.from("hello"), "test.txt");
  });

  describe("parseAsync", () => {
    it("should return an array of files", async (done) => {
      const field = "file";
      const filename = "test.txt";

      const server = await createTestServer(async (req) => {
        const results = await new Transmit(TRANSMIT_OPTIONS).parseAsync(req);

        try {
          expect(results).toEqual({
            fields: [],
            files: [
              expect.objectContaining({
                field,
                name: filename
              })
            ]
          });

          done();
        } catch (error) {
          done(error);
        }
      });

      await request(server).post("/").attach(field, Buffer.from([]), filename);
    });

    it("should delete uploaded files when it emits 'aborted'", async (done) => {
      const server = await createTestServer(async (req) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          minFiles: 2
        });

        const spyOnDeleteUploadedFile = jest.spyOn(transmit, "deleteUploadedFiles");

        await transmit.parseAsync(req).catch(() => undefined); // we expect this to throw, so ignore the error since we aren't testing this

        try {
          expect(spyOnDeleteUploadedFile).toBeCalledTimes(1);

          done();
        } catch (error) {
          done(error);
        }
      });

      await request(server).post("/").attach("file", Buffer.from("hello"), "test.txt");
    });
  });
});
