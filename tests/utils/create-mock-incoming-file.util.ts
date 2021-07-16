import crypto from "crypto";

import { IncomingFile } from "../../src";

export const createMockIncomingFile = (
  field = "file",
  mimetype = "application/octet-stream",
  encoding = "7bit"
): IncomingFile => {
  return {
    encoding,
    field,
    id: crypto.randomBytes(16).toString("hex"),
    mimetype,
    name: crypto.randomBytes(4).toString("hex")
  };
};
