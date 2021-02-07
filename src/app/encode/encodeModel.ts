export enum DataSources {
  File = '1',
  Text = '2',
  Random = '3',
}

export class EncodeModel {
  bitsSubpx: number = 1;
  bitsAlpha: number = 0;
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
