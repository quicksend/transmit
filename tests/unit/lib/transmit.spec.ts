import fs from "fs";
import request from "supertest";
import waitForExpect from "wait-for-expect";

import Busboy from "busboy";

import { createTestServer } from "../../utils/create-test-server.util";
import { createTmpDirectory } from "../../utils/create-tmp-dir.util";
import { FixtureSizes, getFixture } from "../../utils/get-fixture.util";

import { DiskManager, Transmit, TransmitOptions } from "../../../src";

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
} from "../../../src";

const TEMP_DIRECTORY = createTmpDirectory();

const TRANSMIT_OPTIONS: TransmitOptions = {
  field: undefined,
  filter: undefined,
  hashAlgorithm: "md5",
  manager: new DiskManager({
    directory: TEMP_DIRECTORY
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

describe("Transmit", () => {
  afterAll(() => fs.rmSync(TEMP_DIRECTORY, { force: true, recursive: true }));

  it("should be defined", () => {
    expect(Transmit).toBeDefined();
  });

  describe("#abort", () => {
    it("should abort the upload", async (done) => {
      const server = await createTestServer((_req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxFiles: 1
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.abort();

        expect(transmit.aborted).toStrictEqual(true);

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(undefined);

        expect(doneCallback).toBeCalledTimes(1);

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .attach("file", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });

    it("should abort the upload with an error", async (done) => {
      const server = await createTestServer((_req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxFiles: 1
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.abort(new Error());

        expect(transmit.aborted).toStrictEqual(true);

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(expect.objectContaining(new Error()));

        expect(doneCallback).toBeCalledTimes(1);

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .attach("file", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });
  });

  describe("#removeUploadedFiles", () => {
    it("should remove all uploaded files", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          manager: new DiskManager({
            directory: TEMP_DIRECTORY
          }),
          maxFiles: 3
        });

        const spyOnRemoveFile = jest.spyOn(transmit.manager, "removeFile");

        await transmit.parseAsync(req);

        await transmit.removeUploadedFiles();

        expect(spyOnRemoveFile).toBeCalledTimes(3); // 3 times because we uploaded 3 files
        expect(spyOnRemoveFile).toBeCalledWith(expect.objectContaining({ name: "empty.dat" }));
        expect(spyOnRemoveFile).toBeCalledWith(expect.objectContaining({ name: "small.dat" }));
        expect(spyOnRemoveFile).toBeCalledWith(expect.objectContaining({ name: "medium.dat" }));

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .attach("file", getFixture("SMALL"))
        .attach("file", getFixture("MEDIUM"))
        .end(() => server.close(() => done()));
    });
  });

  describe("#parse", () => {
    it("should return an instance of Busboy", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const busboy = new Transmit(TRANSMIT_OPTIONS).parse(req);

        expect(busboy).toBeInstanceOf(Busboy);

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });

    it("should throw error on unsupported content type", async (done) => {
      const server = await createTestServer(async (req, res) => {
        expect(() => new Transmit(TRANSMIT_OPTIONS).parse(req)).toThrow(
          new UnsupportedContentTypeException()
        );

        res.end();
      });

      request(server)
        .post("/")
        .end(() => server.close(() => done()));
    });

    it("should emit 'finished' with file metadata", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit(TRANSMIT_OPTIONS);

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).not.toBeCalled();

        expect(finishedCallback).toBeCalledTimes(1);
        expect(finishedCallback).toBeCalledWith(
          [expect.objectContaining({ name: "empty.dat" })],
          []
        );

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });

    it("should ignore files without filename", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit(TRANSMIT_OPTIONS);

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).not.toBeCalled();

        expect(finishedCallback).toBeCalledTimes(1);
        expect(finishedCallback).toBeCalledWith([], []);

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", Buffer.from([]))
        .end(() => server.close(() => done()));
    });

    it("should ignore files with incorrect field", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          field: "file"
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).not.toBeCalled();

        expect(finishedCallback).toBeCalledTimes(1);
        expect(finishedCallback).toBeCalledWith([], []);

        res.end();
      });

      request(server)
        .post("/")
        .attach("not_file", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });

    it("should ignore file if filter returns false", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          filter: () => false
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).not.toBeCalled();

        expect(finishedCallback).toBeCalledTimes(1);
        expect(finishedCallback).toBeCalledWith([], []);

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with no error on request abort", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit(TRANSMIT_OPTIONS);

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        req.emit("aborted");

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(undefined);

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("LARGE"))
        .end(() => server.close(() => done()));
    });

    // TODO: assumes utf-8
    it("should emit 'aborted' with error when field name is too large", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxFieldNameSize: 1
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new FieldNameTooLargeException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .field("hello", "world")
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when field value size is too large", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxFieldValueSize: 1
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new FieldValueTooLargeException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .field("hello", "world")
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when there are too many fields", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxFields: 1
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new TooManyFieldsException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .field("hello", "world")
        .field("goodbye", "world")
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when file is too large", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxFileSize: FixtureSizes.SMALL
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new FileTooLargeException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("LARGE"))
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when there are too many files", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxFiles: 1
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new TooManyFilesException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("first", getFixture("EMPTY"))
        .attach("second", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when there are too many parts", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          maxParts: 1
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new TooManyPartsException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("first", getFixture("EMPTY"))
        .attach("second", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when there are not enough fields", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          minFields: 2
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new NotEnoughFieldsException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .field("hello", "world")
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when the file is too small", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          minFileSize: FixtureSizes.MEDIUM
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new FileTooSmallException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("SMALL"))
        .end(() => server.close(() => done()));
    });

    it("should emit 'aborted' with error when there are not enough files", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          minFiles: 2
        });

        const abortedCallback = jest.fn();
        const doneCallback = jest.fn();
        const finishedCallback = jest.fn();

        transmit.on("aborted", abortedCallback);
        transmit.on("done", doneCallback);
        transmit.on("finished", finishedCallback);

        transmit.parse(req);

        await waitForExpect(() => expect(doneCallback).toBeCalled());

        expect(abortedCallback).toBeCalledTimes(1);
        expect(abortedCallback).toBeCalledWith(
          expect.objectContaining(new NotEnoughFilesException())
        );

        expect(finishedCallback).not.toBeCalled();

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .end(() => server.close(() => done()));
    });
  });

  describe("#parseAsync", () => {
    it("should return an array of files", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const results = await new Transmit(TRANSMIT_OPTIONS).parseAsync(req);

        expect(results).toEqual({
          fields: [],
          files: [
            expect.objectContaining({ name: "small.dat" }),
            expect.objectContaining({ name: "medium.dat" })
          ]
        });

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("SMALL"))
        .attach("file", getFixture("MEDIUM"))
        .end(() => server.close(() => done()));
    });

    it("should remove all uploaded files when it emits 'aborted'", async (done) => {
      const server = await createTestServer(async (req, res) => {
        const transmit = new Transmit({
          ...TRANSMIT_OPTIONS,
          manager: new DiskManager({
            directory: TEMP_DIRECTORY
          }),
          minFiles: 3 // cause an error so that transmit will abort
        });

        const spyOnRemoveFile = jest.spyOn(transmit.manager, "removeFile");

        await transmit.parseAsync(req).catch(() => undefined); // we expect this to throw, so ignore the error since we aren't testing this

        expect(spyOnRemoveFile).toBeCalledTimes(2); // 2 times because we uploaded 2 files
        expect(spyOnRemoveFile).toBeCalledWith(expect.objectContaining({ name: "empty.dat" }));
        expect(spyOnRemoveFile).toBeCalledWith(expect.objectContaining({ name: "small.dat" }));

        res.end();
      });

      request(server)
        .post("/")
        .attach("file", getFixture("EMPTY"))
        .attach("file", getFixture("SMALL"))
        .end(() => server.close(() => done()));
    });
  });
});
