import { Field } from "./field.interface";
import { File } from "./file.interface";

export interface ParseAsyncResults {
  fields: Field[];
  files: File[];
}
