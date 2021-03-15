import { IncomingFile } from "./incoming-file.interface";

export interface TransmitManager {
  createWritableStream(file: IncomingFile): Promise<NodeJS.WritableStream>;
  deleteFile(file: IncomingFile): Promise<void>;
}
