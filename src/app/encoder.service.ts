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
  DATA_DOESNT_FIT_ERROR: string = "Data doesn't fit";
  GENERIC_DECODE_ERROR: string = "Error extracting information";
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
      throw new Error(this.DATA_DOESNT_FIT_ERROR);
    }
    if ((headerBits.length + dataBits.length) > this.getMaxRawCapacity(source, options)) {
      /* This doesn't account for the header using different options; i.e. it can take up more space than this considers!
       * It will still throw an error after trying to encode and running out of subpixels */
      throw new Error(this.DATA_DOESNT_FIT_ERROR);
    }

    // Encode header
    let subpixel: number;
    let encodingComplete: boolean = false;
    for (subpixel = 0; subpixel < subpixels.length; subpixel++) {
      if (encodingComplete) break;
      encodingComplete = this.writeSubpixel(subpixels, subpixel, this.getBitsOfChannel(this.HEADER_OPTIONS, subpixel % 4), headerBits);
    }

    // Encode data; resume on next subpixel after header
    encodingComplete = false;
    for (; subpixel < subpixels.length; subpixel++) {
      if (encodingComplete) break;
      encodingComplete = this.writeSubpixel(subpixels, subpixel, this.getBitsOfChannel(options, subpixel % 4), dataBits);
    }

    if (!encodingComplete) throw new Error(this.DATA_DOESNT_FIT_ERROR);

    return new ImageData(subpixels, source.width, source.height);
  }

  public decode(source: ImageData): Uint8Array {
    const subpixels: Uint8ClampedArray = Uint8ClampedArray.from(source.data);

    // Read header
    let subpixel: number;
    let readComplete: boolean = false;
    const headerBits: BitsArray = new BitsArray(this.getHeaderSize(source, this.HEADER_OPTIONS));
    for (subpixel = 0; subpixel < subpixels.length; subpixel++) {
      if (readComplete) break;
      readComplete = this.readValue(subpixels[subpixel], this.getBitsOfChannel(this.HEADER_OPTIONS, subpixel % 4), headerBits);
    }
    const header: Header = this.getHeaderFromBitsArray(headerBits);

    // Read data; resume on next subpixel after header
    readComplete = false;
    const dataBits: BitsArray = new BitsArray(header.dataLength);
    for (; subpixel < subpixels.length; subpixel++) {
      if (readComplete) break;
      readComplete = this.readValue(subpixels[subpixel], this.getBitsOfChannel(header.options, subpixel % 4), dataBits);
    }

    if (!readComplete) throw new Error(this.GENERIC_DECODE_ERROR);

    return dataBits.toUint8Array();
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
      this.writeSubpixel(subpixels, subpixel, this.getBitsOfChannel(options, subpixel % 4), dataBits);
    }

    return new ImageData(subpixels, source.width, source.height);
  }

  protected readValue(subpixel: number, numOfBitsToUse: number, dataBits: BitsArray): boolean {
    for (let bitPosition: number = 1; bitPosition <= numOfBitsToUse; bitPosition++) {
      // Check if we've already read all the bits
      if (dataBits.index >= dataBits.length) return true;

      dataBits.push(Utils.readBit(subpixel, bitPosition));
    }

    // Still more data left to read
    return false;
  }

  protected writeSubpixel(subpixels: Uint8ClampedArray, subpixel: number, numOfBitsToUse: number, dataBits: BitsArray): boolean {
    for (let bitPosition: number = 1; bitPosition <= numOfBitsToUse; bitPosition++) {
      const bitToEncode: number = dataBits.getNextBit();

      // Leave if all data has been encoded
      if (bitToEncode === undefined) return true;

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

  protected getHeaderFromBitsArray(headerBits: BitsArray): Header {
    headerBits.index = 0;

    let valueBits: number[][] = [];
    for (let ch: SubpxCh = SubpxCh.RED; ch <= SubpxCh.ALPHA; ch++) {
      valueBits[ch] = [];
      for (let bit: number = 1; bit <= this.BITS_PER_CHANNEL_SIZE; bit++) {
        valueBits[ch].push(headerBits.getNextBit());
      }
    }

    let dataLengthBits: number[] = [];
    let dataLengthBit: number = headerBits.getNextBit();
    while (dataLengthBit !== undefined) {
      dataLengthBits.push(dataLengthBit);
      dataLengthBit = headerBits.getNextBit();
    }

    return {
      options: {
        bitsRed: Utils.bitsToNumber(valueBits[SubpxCh.RED]),
        bitsGreen: Utils.bitsToNumber(valueBits[SubpxCh.GREEN]),
        bitsBlue: Utils.bitsToNumber(valueBits[SubpxCh.BLUE]),
        bitsAlpha: Utils.bitsToNumber(valueBits[SubpxCh.ALPHA]),
      },
      dataLength: Utils.bitsToNumber(dataLengthBits)
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

  protected getHeaderSize(source: ImageData, options: EncoderOptions): number {
    const optionsSize: number = this.BITS_PER_CHANNEL_SIZE * 4;
    const dataLengthSize: number = this.getDataLengthSize(source, options);
    return optionsSize + dataLengthSize;
  }

  protected getDataLengthSize(source: ImageData, options: EncoderOptions): number {
    return Utils.bitSize(this.getMaxRawCapacity(source, options));
  }

  protected stringToUint8Array(input: string): Uint8Array {
    const textEncoder: TextEncoder = new TextEncoder();
    return textEncoder.encode(input);
  }

  public static uint8ArrayToString(data: Uint8Array): string {
    const textDecoder: TextDecoder = new TextDecoder();
    return textDecoder.decode(data);
  }

  protected fileToUint8Array(input: File): Uint8Array {
    // TODO
    return undefined;
  }
}
