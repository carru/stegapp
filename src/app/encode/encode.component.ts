import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { EncoderOptions, EncoderService } from "../encoder.service";
import { Utils } from '../utils';
import { DataSources, EncodeModel } from './encodeModel';

@Component({
  selector: 'app-encode',
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.css'],
})
export class EncodeComponent {
  model: EncodeModel;

  // Accordion navigation
  setStep(index: number) {
    this.model.step = index;
  }
  nextStep() {
    this.model.step++;
  }
  prevStep() {
    this.model.step--;
  }

  constructor(private domSanitizer: DomSanitizer, private encoderService: EncoderService) {
    this.model = new EncodeModel();
  }

  rgbaSliderChange(): void {
    if (this.model.rgbLocked) {
      this.model.options.bitsGreen = this.model.options.bitsRed;
      this.model.options.bitsBlue = this.model.options.bitsRed;
    }
    this.calculateCapacityPreview();
  }

  calculateCapacityPreview(): void {
    if (this.model.imageWidth === undefined) return;

    this.model.capacity = this.encoderService.getMaxRawCapacity(this.model.sourceImageData, this.model.options) / 8;
    this.model.capacityHuman = Utils.toHumanReadable(this.model.capacity);
  }

  async encode() {
    if (this.model.imageWidth === undefined) return;
    // TODO show toast with error if no source image loaded

    let encodedImage: ImageData;

    // Get encoded image data
    switch (this.model.dataSource) {
      case DataSources.File:
        encodedImage = this.encoderService.encodeFile(this.model.sourceImageData, this.model.options, this.model.dataFile);
        break;
      case DataSources.Text:
        encodedImage = this.encoderService.encodeString(this.model.sourceImageData, this.model.options, this.model.dataText);
        break;
      case DataSources.Random:
        encodedImage = this.encoderService.encodeRandom(this.model.sourceImageData, this.model.options);
        break;
    }

    if (!encodedImage) return;
    // TODO show error

    // Convert to blob
    const offscreenCanvas = new OffscreenCanvas(this.model.imageWidth, this.model.imageHeight);
    const offscreenCanvasContext = offscreenCanvas.getContext('2d');
    offscreenCanvasContext.putImageData(encodedImage, 0, 0);
    let encodedBlob: Blob = await offscreenCanvas.convertToBlob();

    // Generate URL for UI display
    URL.revokeObjectURL(this.model.encodedImageURL);
    this.model.encodedImageURL = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(encodedBlob)) as string;
  }

  async load(files: FileList) {
    if (files.length === 0) return;

    const mimeType: string = files[0].type;
    if (mimeType.match(/image\/*/) == null) return;

    const imageFile: File = files[0];

    // Generate URL for UI display
    URL.revokeObjectURL(this.model.sourceImageURL);
    this.model.sourceImageURL = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(imageFile)) as string;

    // Get image metadata
    const imageBitmap: ImageBitmap = await createImageBitmap(imageFile);
    this.model.imageType = imageFile.type;
    this.model.imageName = imageFile.name;
    this.model.imageWidth = imageBitmap.width;
    this.model.imageHeight = imageBitmap.height;

    // Get image data
    const offscreenCanvas = new OffscreenCanvas(this.model.imageWidth, this.model.imageHeight);
    const offscreenCanvasContext = offscreenCanvas.getContext('2d');
    offscreenCanvasContext.drawImage(imageBitmap, 0, 0);
    this.model.sourceImageData = offscreenCanvasContext.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    this.calculateCapacityPreview();
  }
}
