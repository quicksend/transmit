import crypto from "crypto";

import { IncomingFile } from "../../src";

export const createMockIncomingFile = (
  field = "file",
  mimetype = "application/octet-stream",
  encoding = "7bit"
): IncomingFile => {
  return {
    discriminator: crypto.randomBytes(4).toString("hex"),
    encoding,
    field,
    mimetype,
    name: crypto.randomBytes(4).toString("hex")
  };
};
