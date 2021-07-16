import { IncomingFile } from "./incoming-file.interface";

import { Promisable } from "../types/promisable.type";

export interface FilterFunction {
  (file: IncomingFile): Promisable<boolean>;
}
