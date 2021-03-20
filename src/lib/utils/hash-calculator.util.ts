import { Hash, createHash } from "crypto";

import { PassThrough, TransformCallback } from "stream";

/** @internal */
export class HashCalculator extends PassThrough {
  private _digest: string | null = null;
  private _hash: Hash;

  constructor(algorithm: string) {
    super();
    this._hash = createHash(algorithm);
  }

  get digest(): string {
    if (this._digest) return this._digest;

    this._digest = this._hash.digest("hex");

    return this._digest;
  }

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this._hash.update(chunk);
    callback(null, chunk);
  }
}
