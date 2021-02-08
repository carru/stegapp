import { Utils } from "./utils";

export class BitsArray {
  data: number[];
  index: number;
  length: number;

  constructor(length: number = 0) {
    this.data = [];
    this.index = 0;
    this.length = length;
  }

  public getNextBit(): number {
    const bit: number = this.data[this.index];
    this.index++;
    return bit;
  }

  public unshift(bit: number): void {
    this.data.unshift(bit);
    this.index++;
  }

  public push(bit: number): void {
    this.data.push(bit);
    this.index++;
  }

  public toUint8Array(): Uint8Array {
    const lengthInBytes: number = this.length / 8;
    const uint8Array: Uint8Array = new Uint8Array(lengthInBytes);
    for (let byte: number = 0; byte < lengthInBytes; byte++) {
      uint8Array[byte] = Utils.bitsToNumber(this.data.splice(0, 8));
    }
    return uint8Array;
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
