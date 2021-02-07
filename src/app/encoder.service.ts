import { Injectable } from '@angular/core';
import { EncodeComponent } from './encode/encode.component';

export interface EncoderOptions {
  bitsRed: number;
  bitsGreen: number;
  bitsBlue: number;
  bitsAlpha: number;
}

interface Header {
  options: EncoderOptions,
  dataLength: number
}

@Injectable({
  providedIn: 'root'
})
export class EncoderService {

  BITS_PER_CHANNEL_SIZE: number = 4;
  HEADER_OPTIONS: EncoderOptions = {
    bitsRed: 1,
    bitsGreen: 1,
    bitsBlue: 1,
    bitsAlpha: 0
  };

  constructor() { }

  /**
   * Calculates max capacity, in bits, based on encoding options and ignoring Header
   * @param source
   * @param options
   */
  public getMaxRawCapacity(source: ImageData, options: EncoderOptions): number {
    const bitsPixel: number = options.bitsRed + options.bitsGreen + options.bitsBlue + options.bitsAlpha;
    return (source.width * source.height * bitsPixel);
  }

  public encodeFile(source: ImageData, options: EncoderOptions, data: File): ImageData {
    return this.encode(source, options, this.fileToUint8Array(data));
  }

  public encodeString(source: ImageData, options: EncoderOptions, data: string): ImageData {
    return this.encode(source, options, this.stringToUint8Array(data));
  }

  public encode(source: ImageData, options: EncoderOptions, data: Uint8Array): ImageData {
    // New pixel array to encode data
    const encodedPixels: Uint8ClampedArray = Uint8ClampedArray.from(source.data);

    // Convert data to array of individual bits
    const dataBits: BitsArray = BitsArray.uint8ArrayToBitsArray(data);

    // Encode header
    const headerBits: BitsArray = this.getHeaderBitsArray(source, this.getHeader(options, dataBits));
    let subPixel: number;
    let encodingComplete: boolean = false;
    for (subPixel = 0; subPixel < encodedPixels.length; subPixel += 4) {
      if (encodingComplete) break;

      let bitPosition: number;
      let bitToEncode: number;

      for (bitPosition = 1; bitPosition <= this.HEADER_OPTIONS.bitsRed; bitPosition++) {
        bitToEncode = headerBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel] = Utils.setBit(encodedPixels[subPixel], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= this.HEADER_OPTIONS.bitsGreen; bitPosition++) {
        bitToEncode = headerBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel + 1] = Utils.setBit(encodedPixels[subPixel + 1], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= this.HEADER_OPTIONS.bitsBlue; bitPosition++) {
        bitToEncode = headerBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel + 2] = Utils.setBit(encodedPixels[subPixel + 2], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= this.HEADER_OPTIONS.bitsAlpha; bitPosition++) {
        bitToEncode = headerBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel + 3] = Utils.setBit(encodedPixels[subPixel + 3], bitPosition, bitToEncode);
      }
    }

    // Encode data; resume on next pixel after header
    encodingComplete = false;
    for (; subPixel < encodedPixels.length; subPixel += 4) {
      if (encodingComplete) break;

      let bitPosition: number;
      let bitToEncode: number;

      for (bitPosition = 1; bitPosition <= options.bitsRed; bitPosition++) {
        bitToEncode = dataBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel] = Utils.setBit(encodedPixels[subPixel], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= options.bitsGreen; bitPosition++) {
        bitToEncode = dataBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel + 1] = Utils.setBit(encodedPixels[subPixel + 1], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= options.bitsBlue; bitPosition++) {
        bitToEncode = dataBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel + 2] = Utils.setBit(encodedPixels[subPixel + 2], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= options.bitsAlpha; bitPosition++) {
        bitToEncode = dataBits.getNextBit();
        if (bitToEncode === undefined) {
          encodingComplete = true;
          break;
        }
        encodedPixels[subPixel + 3] = Utils.setBit(encodedPixels[subPixel + 3], bitPosition, bitToEncode);
      }
    }

    return new ImageData(encodedPixels, source.width, source.height);
  }

  /**
   * Fill image with random data. Useful to preview image degradation
   * @param source
   * @param options
   */
  public encodeRandom(source: ImageData, options: EncoderOptions): ImageData {
    // New pixel array to encode data
    const encodedPixels: Uint8ClampedArray = Uint8ClampedArray.from(source.data);

    // Iterate pixels
    for (let subPixel: number = 0; subPixel < encodedPixels.length; subPixel += 4) {
      let bitPosition: number;
      let bitToEncode: number;

      for (bitPosition = 1; bitPosition <= options.bitsRed; bitPosition++) {
        bitToEncode = Math.random() < 0.5 ? 1 : 0;
        encodedPixels[subPixel] = Utils.setBit(encodedPixels[subPixel], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= options.bitsGreen; bitPosition++) {
        bitToEncode = Math.random() < 0.5 ? 1 : 0;
        encodedPixels[subPixel + 1] = Utils.setBit(encodedPixels[subPixel + 1], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= options.bitsBlue; bitPosition++) {
        bitToEncode = Math.random() < 0.5 ? 1 : 0;
        encodedPixels[subPixel + 2] = Utils.setBit(encodedPixels[subPixel + 2], bitPosition, bitToEncode);
      }
      for (bitPosition = 1; bitPosition <= options.bitsAlpha; bitPosition++) {
        bitToEncode = Math.random() < 0.5 ? 1 : 0;
        encodedPixels[subPixel + 3] = Utils.setBit(encodedPixels[subPixel + 3], bitPosition, bitToEncode);
      }
    }

    return new ImageData(encodedPixels, source.width, source.height);
  }

  protected getHeader(options: EncoderOptions, data: BitsArray): Header {
    return {
      options: options,
      dataLength: data.length
    }
  }

  protected getHeaderBitsArray(source: ImageData, header: Header): BitsArray {
    let data: number[] = [];

    // options
    data.push(...Utils.numberToBits(header.options.bitsRed, this.BITS_PER_CHANNEL_SIZE));
    data.push(...Utils.numberToBits(header.options.bitsGreen, this.BITS_PER_CHANNEL_SIZE));
    data.push(...Utils.numberToBits(header.options.bitsBlue, this.BITS_PER_CHANNEL_SIZE));
    data.push(...Utils.numberToBits(header.options.bitsAlpha, this.BITS_PER_CHANNEL_SIZE));

    // dataLength
    data.push(...Utils.numberToBits(header.dataLength, this.getDataLengthSize(source, header.options)));

    return BitsArray.arrayToBitsArray(data);
  }

  protected getDataLengthSize(source: ImageData, options: EncoderOptions): number {
    return Utils.bitSize(this.getMaxRawCapacity(source, options));
  }

  protected stringToUint8Array(input: string): Uint8Array {
    const textEncoder: TextEncoder = new TextEncoder();
    return textEncoder.encode(input);
  }

  protected fileToUint8Array(input: File): Uint8Array {
    // TODO
    return undefined;
  }
}

class BitsArray {
  data: number[];
  index: number;
  length: number;

  constructor() { }

  public getNextBit(): number {
    this.index++;
    if (this.index >= this.length) {
      this.index--;
      return undefined;
    }
    return this.data[this.index];
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

class Utils {
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
}
