import { Injectable } from '@angular/core';
import { BitsArray } from './bitsArray';
import { RandomBitsArray } from './randomBitsArray';
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

enum SubpxCh {
  RED = 0,
  GREEN,
  BLUE,
  ALPHA
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
    const subpixels: Uint8ClampedArray = Uint8ClampedArray.from(source.data);

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
      /* This doesn't account for the header using different options; i.e. it can take up more space than this considers!
       * It will still throw an error after trying to encode and running out of subpixels */
      throw new Error("Data doesn't fit");
    }

    // Encode header
    let subpixel: number;
    let encodingComplete: boolean = false;
    for (subpixel = 0; subpixel < subpixels.length; subpixel++) {
      if (encodingComplete) break;
      encodingComplete = this.writeSubPixel(subpixels, subpixel, this.getBitsOfChannel(this.HEADER_OPTIONS, subpixel % 4), headerBits);
    }

    // Encode data; resume on next subpixel after header
    encodingComplete = false;
    for (; subpixel < subpixels.length; subpixel++) {
      if (encodingComplete) break;
      encodingComplete = this.writeSubPixel(subpixels, subpixel, this.getBitsOfChannel(options, subpixel % 4), dataBits);
    }

    if (!encodingComplete) throw new Error("Data doesn't fit");

    return new ImageData(subpixels, source.width, source.height);
  }

  /**
   * Fill image with random data. Useful to preview image degradation
   * @param source
   * @param options
   */
  public encodeRandom(source: ImageData, options: EncoderOptions): ImageData {
    // New pixel array to encode data
    const subpixels: Uint8ClampedArray = Uint8ClampedArray.from(source.data);

    // Use random data source
    const dataBits: RandomBitsArray = new RandomBitsArray();

    // Iterate pixels
    for (let subpixel: number = 0; subpixel < subpixels.length; subpixel++) {
      // RandomBitsArray is infinite so no need to check if encoding is done
      this.writeSubPixel(subpixels, subpixel, this.getBitsOfChannel(options, subpixel % 4), dataBits);
    }

    return new ImageData(subpixels, source.width, source.height);
  }

  protected writeSubPixel(subpixels: Uint8ClampedArray, subpixel: number, numOfBitsToUse: number, dataBits: BitsArray): boolean {
    for (let bitPosition: number = 1; bitPosition <= numOfBitsToUse; bitPosition++) {
      const bitToEncode: number = dataBits.getNextBit();

      // Leave if all data has been encoded
      if (bitToEncode === undefined)
        return true;

      subpixels[subpixel] = Utils.setBit(subpixels[subpixel], bitPosition, bitToEncode);
    }

    // Still more data left to encode
    return false;
  }

  protected getBitsOfChannel(options: EncoderOptions, channel: SubpxCh): number {
    switch (channel) {
      case SubpxCh.RED:
        return options.bitsRed;
      case SubpxCh.GREEN:
        return options.bitsGreen;
      case SubpxCh.BLUE:
        return options.bitsBlue;
      case SubpxCh.ALPHA:
        return options.bitsAlpha;
    }
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
    for (let ch: SubpxCh = SubpxCh.RED; ch <= SubpxCh.ALPHA; ch++) {
      data.push(...Utils.numberToBits(this.getBitsOfChannel(header.options, ch), this.BITS_PER_CHANNEL_SIZE));
    }

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
