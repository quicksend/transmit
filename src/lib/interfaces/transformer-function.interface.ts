import { IncomingFile } from "./incoming-file.interface";

export interface TransformerFunction {
  (file: IncomingFile): NodeJS.ReadWriteStream;
}
