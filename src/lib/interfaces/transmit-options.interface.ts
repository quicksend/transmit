import { FilterFunction } from "./filter-function.interface";
import { TransformerFunction } from "./transformer-function.interface";
import { TransmitManager } from "./transmit-manager.interface";

export interface TransmitOptions {
  /**
   * File field to accept files from.
   */
  field?: string;

  /**
   * Function that returns a boolean to determine which files should be uploaded.
   */
  filter?: FilterFunction;

  /**
   * The hash algorithm used to compute the file checksum.
   */
  hashAlgorithm: "md5" | "sha1" | "sha256";

  /**
   * Transmit manager to handle the final upload destination.
   */
  manager: TransmitManager;

  /**
   * Max number of header key => value pairs to parse.
   */
  maxHeaderPairs: number;

  /**
   * Min number of text fields.
   */
  minFields: number;

  /**
   * Max number of text fields.
   */
  maxFields: number;

  /**
   * Min number of file fields.
   */
  minFiles: number;

  /**
   * Max number of file fields.
   */
  maxFiles: number;

  /**
   * Max field name size (in bytes).
   */
  maxFieldNameSize: number;

  /**
   * Max field value size (in bytes).
   */
  maxFieldValueSize: number;

  /**
   * Min file size per file field (in bytes).
   */
  minFileSize: number;

  /**
   * Max file size per file field (in bytes).
   */
  maxFileSize: number;

  /**
   * Max number of parts (fields + files).
   */
  maxParts: number;

  /**
   * Array of functions that returns a ReadWriteStream to modify uploaded files.
   */
  transformers: TransformerFunction[];

  /**
   * Whether field names that exceed "maxFieldNameSize" should be silently truncated.
   */
  truncateFieldNames: boolean;

  /**
   * Whether field values that exceed "maxFieldValueSize" should be silently truncated.
   */
  truncateFieldValues: boolean;
}
