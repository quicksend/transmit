import { IncomingFile } from "./incoming-file.interface";

export interface TransmitManager {
  createWritableStream(file: IncomingFile): Promise<NodeJS.WritableStream> | NodeJS.WritableStream;
  deleteFile(file: IncomingFile): Promise<void> | void;
}
