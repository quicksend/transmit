import { IncomingFile } from "./incoming-file.interface";

export interface FilterFunction {
  (file: IncomingFile): Promise<boolean>;
}
