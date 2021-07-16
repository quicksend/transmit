import { IncomingFile } from "./incoming-file.interface";

import { Promisable } from "../types/promisable.type";

export interface TransmitManager {
  createWritableStream(file: IncomingFile): Promisable<NodeJS.WritableStream>;
  deleteFile(file: IncomingFile): Promisable<void>;
}
