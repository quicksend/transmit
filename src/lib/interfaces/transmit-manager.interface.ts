import { IncomingFile } from "./incoming-file.interface";

import { Promisable } from "../types/promisable.type";

export interface TransmitManager {
  handleFile(file: IncomingFile): Promisable<NodeJS.WritableStream>;
  removeFile(file: IncomingFile): Promisable<void>;
}
