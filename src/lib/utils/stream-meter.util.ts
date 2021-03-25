import { PassThrough, TransformCallback } from "stream";

/** @internal */
export class StreamMeter extends PassThrough {
  private _size = 0;

  get size(): number {
    return this._size;
  }

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this._size += chunk.length;
    callback(null, chunk);
  }
}
