import { EncoderOptions } from "../encoder.service";

export enum DataSources {
  File = '1',
  Text = '2',
  Random = '3',
}

export class EncodeModel {
  options: EncoderOptions = {
    bitsRed: 1,
    bitsGreen: 1,
    bitsBlue: 1,
    bitsAlpha: 0
  };
  rgbLocked: boolean = true;
  livePreview: boolean = false;

  imageName: string;
  imageType: string;
  imageWidth: number;
  imageHeight: number;
  capacity: number;
  capacityHuman: string;

  sourceImageURL: string;
  encodedImageURL: string;

  sourceImageData: ImageData;

  dataSource: string = DataSources.Text;
  dataText: string;
  dataFile: File;

  step: number = 0;
}
