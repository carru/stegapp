import { EncoderOptions } from "../encoder.service";

export class DecodeModel {
  sourceImageData: ImageData;
  sourceImageURL: string;
  dataText: string;
  options: EncoderOptions = {
    bitsRed: 0,
    bitsGreen: 0,
    bitsBlue: 0,
    bitsAlpha: 0
  };
}
