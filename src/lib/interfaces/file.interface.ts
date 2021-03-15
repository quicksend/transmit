import { IncomingFile } from "./incoming-file.interface";

export interface File extends IncomingFile {
  hash: string;
  size: number;
}
