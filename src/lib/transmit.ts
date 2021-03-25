import Busboy from "busboy";
import stream from "stream";

import { EventEmitter } from "events";
import { IncomingMessage } from "http";
import { promisify } from "util";

import { Counter, HashCalculator, StreamMeter, generateRandomString } from "./transmit.utils";

import { DiskManager } from "./transmit.managers";

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
} from "./transmit.exceptions";

import {
  BusboyReadable,
  Field,
  File,
  IncomingFile,
  ParseAsyncResults,
  TransmitManager,
  TransmitOptions
} from "./transmit.interfaces";

const pipeline = promisify(stream.pipeline);

export const TRANSMIT_DEFAULT_OPTIONS: TransmitOptions = {
  hashAlgorithm: "sha256",
  manager: new DiskManager(),
  minFields: 0,
  maxFields: 100,
  minFiles: 1,
  maxFiles: 1,
  maxFieldNameSize: 100,
  maxFieldValueSize: 1 * 1024 * 1024,
  minFileSize: 0,
  maxFileSize: 100 * 1024 * 1024,
  maxHeaderPairs: Infinity,
  maxParts: Infinity,
  transformers: [],
  truncateFieldNames: false,
  truncateFieldValues: false
};

export class Transmit extends EventEmitter {
  private readonly fields: Field[] = [];
  private readonly files: File[] = [];
  private readonly incoming: IncomingFile[] = [];

  private readonly options: TransmitOptions;
  private readonly pendingFiles = new Counter();

  private isAborted = false;
  private isFinished = false;

  constructor(options: Partial<TransmitOptions> = {}) {
    super();
    this.options = {
      ...TRANSMIT_DEFAULT_OPTIONS,
      ...options
    };
  }

  /**
   * Whether the upload has been aborted.
   */
  get aborted(): boolean {
    return this.isAborted;
  }

  /**
   * Whether the upload has been finished.
   */
  get finished(): boolean {
    return this.isFinished;
  }

  /**
   * The transmit manager used for this instance.
   */
  get manager(): TransmitManager {
    return this.options.manager;
  }

  /**
   * Abort the current upload. Emits "aborted" and "done" events.
   */
  abort(error?: Error): void {
    if (this.aborted || this.finished) {
      return;
    }

    this.isAborted = true;

    this.pendingFiles.whenItEqualsTo(0, () => {
      this.emit("aborted", error);
      this.emit("done");
    });
  }

  /**
   * Delete uploaded files for this request. Useful for cleanup after aborting the upload.
   */
  async deleteUploadedFiles(): Promise<void> {
    const tasks = await Promise.allSettled(
      this.incoming.map((file) => this.manager.deleteFile(file))
    );

    for (const task of tasks) {
      if (task.status === "rejected") {
        throw task.reason;
      }
    }
  }

  /**
   * Parse an incoming request with form data.
   */
  parse(req: IncomingMessage): busboy.Busboy {
    const busboy = this.createBusboy({
      headers: req.headers,
      limits: {
        fieldNameSize: this.options.maxFieldNameSize,
        fieldSize: this.options.maxFieldValueSize,
        fields: this.options.maxFields,
        fileSize: this.options.maxFileSize,
        files: this.options.maxFiles,
        headerPairs: this.options.maxHeaderPairs,
        parts: this.options.maxParts
      }
    });

    req.on("aborted", () => {
      busboy.end();
      this.abort();
    });

    req.pipe(busboy);

    return busboy;
  }

  /**
   * Parse an incoming request with form data and return its fields and files.
   * If the request is aborted, all uploaded files will be deleted.
   */
  parseAsync(req: IncomingMessage): Promise<ParseAsyncResults> {
    const busboy = this.parse(req);

    return new Promise((resolve, reject) => {
      this.once("aborted", async (error?: Error) => {
        await this.deleteUploadedFiles();

        if (error) {
          return reject(error);
        }

        resolve({
          fields: [],
          files: []
        });
      });

      this.once("done", () => {
        req.unpipe(busboy);

        // Drain the stream to make sure req emits "end" event
        // https://nodejs.org/api/stream.html#stream_event_end
        req.on("readable", req.read.bind(req));

        busboy.removeAllListeners();
      });

      this.once("finished", (files, fields) => {
        resolve({
          fields,
          files
        });
      });
    });
  }

  private createBusboy(options: busboy.BusboyConfig) {
    try {
      return new Busboy(options)
        .on("field", (...args) => this.handleIncomingField(...args))
        .on("file", (...args) => {
          this.pendingFiles.increment();

          this.handleIncomingFile(...args)
            .finally(() => this.pendingFiles.decrement())
            .then(() => this.finish())
            .catch((error) => this.abort(error));
        })
        .once("error", (error: Error) => this.abort(error))
        .once("fieldsLimit", () => this.abort(new TooManyFieldsException()))
        .once("filesLimit", () => this.abort(new TooManyFilesException()))
        .once("finish", () => this.finish())
        .once("partsLimit", () => this.abort(new TooManyPartsException()));
    } catch {
      throw new UnsupportedContentTypeException();
    }
  }

  private finish() {
    if (this.aborted || this.finished || !this.pendingFiles.is(0)) {
      return;
    }

    if (this.fields.length < this.options.minFields) {
      return this.abort(new NotEnoughFieldsException());
    }

    if (this.files.length < this.options.minFiles) {
      return this.abort(new NotEnoughFilesException());
    }

    // this.options.maxFiles is used in busboy config so no need to check that

    this.isFinished = true;

    this.emit("finished", this.files, this.fields);
    this.emit("done");
  }

  private handleIncomingField(
    fieldName: string,
    value: string,
    fieldNameTruncated: boolean,
    valueTruncated: boolean,
    encoding: string,
    mimetype: string
  ) {
    // workaround for busboy bug, see https://github.com/mscdex/busboy/pull/59
    if (fieldName.length > this.options.maxFieldNameSize) {
      fieldName = fieldName.substr(0, this.options.maxFieldNameSize);
      fieldNameTruncated = true;
    }

    if (fieldNameTruncated && !this.options.truncateFieldNames) {
      return this.abort(new FieldNameTooLargeException());
    }

    if (valueTruncated && !this.options.truncateFieldValues) {
      return this.abort(new FieldValueTooLargeException());
    }

    this.fields.push({
      encoding,
      mimetype,
      name: fieldName,
      value: String(value)
    });
  }

  private async handleIncomingFile(
    field: string,
    readable: NodeJS.ReadableStream,
    filename: string | undefined,
    encoding: string,
    mimetype: string
  ) {
    if (this.aborted || this.finished) {
      return readable.resume();
    }

    // Ignore files with empty filenames
    if (!filename || filename.length <= 0) {
      return readable.resume();
    }

    if (this.options.field && field !== this.options.field) {
      return readable.resume();
    }

    const incomingFile: IncomingFile = {
      discriminator: await generateRandomString(4),
      encoding,
      field,
      mimetype,
      name: filename
    };

    const accept = this.options.filter ? await this.options.filter(incomingFile) : true;

    if (!accept) {
      return readable.resume();
    }

    this.incoming.push(incomingFile);

    // Create PR and add truncated property to readable stream
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/busboy/index.d.ts#L41
    await this.writeFile(incomingFile, readable as BusboyReadable);
  }

  private async writeFile(file: IncomingFile, readable: BusboyReadable) {
    const writable = await this.manager.createWritableStream(file);

    const hash = new HashCalculator(this.options.hashAlgorithm);

    const sizeBeforeTransformers = new StreamMeter();
    const sizeAfterTransformers = new StreamMeter();

    const transformers = this.options.transformers.map((transform) => transform(file));

    await pipeline(
      readable,
      sizeBeforeTransformers, // Capture the file size before the file is modified
      ...transformers,
      sizeAfterTransformers, // Capture the file size after the file has been modified
      hash,
      writable
    );

    if (readable.truncated) {
      throw new FileTooLargeException();
    }

    if (sizeBeforeTransformers.size < this.options.minFileSize) {
      throw new FileTooSmallException();
    }

    this.files.push({
      ...file,
      hash: hash.digest,
      size: sizeAfterTransformers.size
    });
  }
}
