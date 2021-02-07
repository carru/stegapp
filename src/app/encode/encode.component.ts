import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { EncoderOptions, EncoderService } from "../encoder.service";

export enum DataSources {
  File = '1',
  Text = '2',
  Random = '3',
}

@Component({
  selector: 'app-encode',
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.css'],
})
export class EncodeComponent {

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

  // Accordion navigation
  step: number = 0;
  setStep(index: number) {
    this.step = index;
  }
  nextStep() {
    this.step++;
  }
  prevStep() {
    this.step--;
  }

  constructor(private domSanitizer: DomSanitizer, private encoderService: EncoderService) {}

  calculateCapacityPreview(): void {
    if (this.imageWidth === undefined) return;

    this.capacity = this.encoderService.getMaxRawCapacity(this.sourceImageData, this.getOptions()) / 8;
    this.capacityHuman = this.toHumanReadable(this.capacity);
  }

  toHumanReadable(input: number): string {
    const units: string[] = ['B', 'kB', 'MB'];
    let i: number = 0;
    while (input > 1000) {
      if (i >= units.length - 1) break;

      i++;
      input = input / 1000;
    }
    return `${input.toFixed(1)} ${units[i]}`;
  }

  getOptions(): EncoderOptions {
    return {
      bitsRed: this.bitsSubpx,
      bitsGreen: this.bitsSubpx,
      bitsBlue: this.bitsSubpx,
      bitsAlpha: this.bitsAlpha
    }
  }

  async encode() {
    if (this.imageWidth === undefined) return;
    // TODO show toast with error if no source image loaded

    let encodedImage: ImageData;

    // Get encoded image data
    switch (this.dataSource) {
      case DataSources.File:
        encodedImage = this.encoderService.encodeFile(this.sourceImageData, this.getOptions(), this.dataFile);
        break;
      case DataSources.Text:
        encodedImage = this.encoderService.encodeString(this.sourceImageData, this.getOptions(), this.dataText);
        break;
      case DataSources.Random:
        encodedImage = this.encoderService.encodeRandom(this.sourceImageData, this.getOptions());
        break;
    }

    if (!encodedImage) return;
    // TODO show error

    // Convert to blob
    const offscreenCanvas = new OffscreenCanvas(this.imageWidth, this.imageHeight);
    const offscreenCanvasContext = offscreenCanvas.getContext('2d');
    offscreenCanvasContext.putImageData(encodedImage, 0, 0);
    let encodedBlob: Blob = await offscreenCanvas.convertToBlob();

    // Generate URL for UI display
    URL.revokeObjectURL(this.encodedImageURL);
    this.encodedImageURL = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(encodedBlob)) as string;
  }

  async load(files: FileList) {
    if (files.length === 0) return;

    const mimeType: string = files[0].type;
    if (mimeType.match(/image\/*/) == null) return;

    const imageFile: File = files[0];

    // Generate URL for UI display
    URL.revokeObjectURL(this.sourceImageURL);
    this.sourceImageURL = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(imageFile)) as string;

    // Get image metadata
    const imageBitmap: ImageBitmap = await createImageBitmap(imageFile);
    this.imageType = imageFile.type;
    this.imageName = imageFile.name;
    this.imageWidth = imageBitmap.width;
    this.imageHeight = imageBitmap.height;

    // Get image data
    const offscreenCanvas = new OffscreenCanvas(this.imageWidth, this.imageHeight);
    const offscreenCanvasContext = offscreenCanvas.getContext('2d');
    offscreenCanvasContext.drawImage(imageBitmap, 0, 0);
    this.sourceImageData = offscreenCanvasContext.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    this.calculateCapacityPreview();
  }
}
