import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

export const createTmpDirectory = (): string => {
  const id = crypto.randomBytes(4).toString("hex");
  const destination = path.join(os.tmpdir(), `tmp-${id}`);

  fs.mkdirSync(destination);

  return destination;
};
