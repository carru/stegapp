import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-encode',
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.css'],
})
export class EncodeComponent implements AfterViewInit {
  // @ViewChild('sourceCanvas') sourceCanvasEl: ElementRef<HTMLCanvasElement>;
  // sourceContext: CanvasRenderingContext2D;
  // sourceCanvas: HTMLCanvasElement;
  // @ViewChild('outCanvas') outCanvasEl: ElementRef<HTMLCanvasElement>;
  // outContext: CanvasRenderingContext2D;
  // outCanvas: HTMLCanvasElement;

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

  constructor(private domSanitizer: DomSanitizer) {}

  ngAfterViewInit(): void {
    // Get canvases and contexts
    // this.sourceCanvas = this.sourceCanvasEl.nativeElement;
    // this.outCanvas = this.outCanvasEl.nativeElement;
    // this.sourceContext = this.sourceCanvas.getContext('2d');
    // this.outContext = this.outCanvas.getContext('2d');
  }

  calculateCapacity(): void {
    if(this.imageWidth === undefined)
      return;

    const bitsPixel: number = this.bitsAlpha + 3 * this.bitsSubpx; // RGBA
    this.capacity = this.imageWidth * this.imageHeight * bitsPixel / 8;
    this.capacityHuman = this.toHumanReadable(this.capacity);
  }

  toHumanReadable(input: number): string {
    const units: string[] = ['B', 'kB', 'MB'];
    let i: number = 0;
    while(input > 1000) {
      if(i >= units.length - 1)
        break;

      i++;
      input = input / 1000;
    }
    return `${input.toFixed(1)} ${units[i]}`;
  }

  async load(files: FileList) {
    if(files.length === 0) return;

    const mimeType: string = files[0].type;
    if(mimeType.match(/image\/*/) == null) {
      return;
    }

    const imageFile: File = files[0];

    // Generate URL for UI display
    URL.revokeObjectURL(this.sourceImageURL);
    this.sourceImageURL = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(imageFile)) as string;

    // Get image data
    const imageBitmap: ImageBitmap = await createImageBitmap(imageFile);
    this.imageType = imageFile.type;
    this.imageName = imageFile.name;
    this.imageWidth = imageBitmap.width;
    this.imageHeight = imageBitmap.height;
    this.calculateCapacity();
    // this.sourceCanvas.width = this.imageWidth;
    // this.sourceCanvas.height = this.imageHeight;
    // this.sourceContext.drawImage(imageBitmap, 0, 0);
    const offscreenCanvas = new OffscreenCanvas(this.imageWidth, this.imageHeight);
    const offscreenCanvasContext = offscreenCanvas.getContext('2d');
    offscreenCanvasContext.drawImage(imageBitmap, 0, 0);
    this.sourceImageData = offscreenCanvasContext.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
  }
}
