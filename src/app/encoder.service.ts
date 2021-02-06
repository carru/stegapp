import { Injectable } from '@angular/core';

export interface EncoderOptions {
  bitsRed: number;
  bitsGreen: number;
  bitsBlue: number;
  bitsAlpha: number;
}

@Injectable({
  providedIn: 'root'
})
export class EncoderService {

  constructor() { }

  public encodeFile(source: ImageData, options: EncoderOptions, data: File): ImageData {
    // TODO
    return source;
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
      for (bitPosition = 1; bitPosition <= options.bitsRed; bitPosition++) {
        encodedPixels[subPixel] = this.setBit(encodedPixels[subPixel], bitPosition, Math.random() < 0.5);
      }
      for (bitPosition = 1; bitPosition <= options.bitsGreen; bitPosition++) {
        encodedPixels[subPixel + 1] = this.setBit(encodedPixels[subPixel + 1], bitPosition, Math.random() < 0.5);
      }
      for (bitPosition = 1; bitPosition <= options.bitsBlue; bitPosition++) {
        encodedPixels[subPixel + 2] = this.setBit(encodedPixels[subPixel + 2], bitPosition, Math.random() < 0.5);
      }
      for (bitPosition = 1; bitPosition <= options.bitsAlpha; bitPosition++) {
        encodedPixels[subPixel + 3] = this.setBit(encodedPixels[subPixel + 3], bitPosition, Math.random() < 0.5);
      }
    }

    return new ImageData(encodedPixels, source.width, source.height);
  }

  public encodeString(source: ImageData, options: EncoderOptions, data: string): ImageData {
    // TODO
    return source;
  }

  protected setBit(input: number, bitPosition: number, bitValue: boolean) {
    const bitValueNormalized = bitValue ? 1 : 0;
    const clearMask = ~(1 << bitPosition);
    return (input & clearMask) | (bitValueNormalized << bitPosition);
  }
}
