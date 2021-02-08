import { ɵɵpipeBind1 } from "@angular/core";

export class Utils {
  public static numberToBits(number: number, numberOfBits: number): number[] {
    let data: number[] = [];
    const bits: string[] = number.toString(2).split('');
    const paddingBits: number = numberOfBits - bits.length;

    if (paddingBits < 0)
      throw new Error(`Cannot encode ${number} with ${numberOfBits} bits; too large`);

    // Add padding zeroes
    for (let i = 1; i <= paddingBits; i++) {
      data.push(0);
    }
    bits.forEach(bit => data.push(parseInt(bit)));

    return data;
  }

  public static bitSize(number: number): number {
    return number.toString(2).length;
  }

  public static setBit(input: number, bitPosition: number, bitValue: number): number {
    const bitValueNormalized: 1 | 0 = bitValue ? 1 : 0;
    const clearMask: number = ~(1 << bitPosition);
    return (input & clearMask) | (bitValueNormalized << bitPosition);
  }

  public static readBit(input: number, bitPosition: number): number {
    input = input >> (bitPosition - 1);
    return input & 0b1;
  }

  public static toHumanReadable(input: number): string {
    const units: string[] = ['B', 'kB', 'MB'];
    let i: number = 0;
    while (input > 1000) {
      if (i >= units.length - 1) break;

      i++;
      input = input / 1000;
    }
    return `${input.toFixed(1)} ${units[i]}`;
  }
}
