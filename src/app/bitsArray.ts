import { Utils } from "./utils";

export class BitsArray {
  data: number[];
  index: number;
  length: number;

  constructor() {
    this.data = [];
    this.index = 0;
    this.length = 0;
  }

  public getNextBit(): number {
    this.index++;
    if (this.index >= this.length) {
      this.index--;
      return undefined;
    }
    return this.data[this.index];
  }

  public push(bit: number): void {
    this.data.push(bit);
    this.length = this.data.length;
  }

  public static arrayToBitsArray(data: number[]): BitsArray {
    let bitsArray: BitsArray = new BitsArray();
    bitsArray.data = data;
    bitsArray.index = 0;
    bitsArray.length = bitsArray.data.length;
    return bitsArray;
  }

  public static uint8ArrayToBitsArray(data: Uint8Array): BitsArray {
    let bitsArray: BitsArray = new BitsArray();
    bitsArray.data = BitsArray.toBits(data);
    bitsArray.index = 0;
    bitsArray.length = bitsArray.data.length;
    return bitsArray;
  }

  protected static toBits(dataBytes: Uint8Array): number[] {
    let data: number[] = [];
    dataBytes.forEach(byte => data.push(...Utils.numberToBits(byte, 8)));
    return data;
  }
}
