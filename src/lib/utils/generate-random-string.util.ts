import * as crypto from "crypto";

/** @internal */
export const generateRandomString = (size = 4): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(size, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer.toString("hex"));
      }
    });
  });
};
