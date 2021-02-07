import { Injectable } from '@angular/core';
import { BitsArray } from './bitsArray';
import { Utils } from './utils';

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

    // Prepare header and check total payload length
    let headerBits: BitsArray;
    try {
      headerBits = this.getHeaderBitsArray(source, this.getHeader(options, dataBits));
    } catch (error) {
      console.warn(error);
      throw new Error("Data doesn't fit");
    }
    if ((headerBits.length + dataBits.length) > this.getMaxRawCapacity(source, options)) {
      // This doesn't account for the header using different options; i.e. it can take up more space than this considers!
      throw new Error("Data doesn't fit");
    }

    // Encode header
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
