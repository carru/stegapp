import { BitsArray } from "./bitsArray";

/**
 * Special BitsArray that always returns random data
 */
export class RandomBitsArray extends BitsArray {

  constructor() {
    super();
    this.data = undefined
    this.index = undefined;
    this.length = undefined;
  }

  public getNextBit(): number {
    return Math.random() < 0.5 ? 1 : 0;
  }
}
