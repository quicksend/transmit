import { EventEmitter } from "events";

/** @internal */
export class Counter extends EventEmitter {
  constructor(private _value = 0) {
    super();
  }

  get value(): number {
    return this._value;
  }

  decrement(amount = 1): this {
    this._value -= amount;
    this.emit(String(this._value));

    return this;
  }

  increment(amount = 1): this {
    this._value += amount;
    this.emit(String(this._value));

    return this;
  }

  is(n: number): boolean {
    return this._value === n;
  }

  onceItEqualsTo(n: number, cb: () => void): void {
    if (this._value === n) {
      cb();
    } else {
      this.once(String(n), cb);
    }
  }

  set(value: number): this {
    this._value = value;
    this.emit(String(this._value));

    return this;
  }

  whenItEqualsTo(n: number, cb: () => void): void {
    if (this._value === n) {
      cb();
    }

    this.on(String(n), cb);
  }
}
