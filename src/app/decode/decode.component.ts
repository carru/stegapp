import { Component } from '@angular/core';
import { EncoderService } from '../encoder.service';

@Component({
  selector: 'app-decode',
  templateUrl: './decode.component.html',
  styleUrls: ['./decode.component.css']
})
export class DecodeComponent {
  sourceImageData: ImageData;
  dataText: string;

  constructor(private encoderService: EncoderService) { }

  async load(files: FileList) {
    if (files.length === 0) return;

    const mimeType: string = files[0].type;
    if (mimeType.match(/image\/png/) == null) return;

    const imageFile: File = files[0];

    // Get image data
    const imageBitmap: ImageBitmap = await createImageBitmap(imageFile);
    const offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const offscreenCanvasContext = offscreenCanvas.getContext('2d');
    offscreenCanvasContext.drawImage(imageBitmap, 0, 0);
    this.sourceImageData = offscreenCanvasContext.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    this.decode();
  }

  decode() {
    const data: Uint8Array = this.encoderService.decode(this.sourceImageData);
    this.dataText = EncoderService.uint8ArrayToString(data);
  }

}
