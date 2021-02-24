import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DecodingResults, EncoderService, Header } from '../encoder.service';
import { DecodeModel } from './decodeModel';

@Component({
  selector: 'app-decode',
  templateUrl: './decode.component.html',
  styleUrls: ['./decode.component.css']
})
export class DecodeComponent {
  model: DecodeModel;

  constructor(private domSanitizer: DomSanitizer, private encoderService: EncoderService) {
    this.model = new DecodeModel();
  }

  async load(files: FileList) {
    if (files.length === 0) return;

    const mimeType: string = files[0].type;
    if (mimeType.match(/image\/png/) == null) return;

    const imageFile: File = files[0];

    // Generate URL for UI display
    URL.revokeObjectURL(this.model.sourceImageURL);
    this.model.sourceImageURL = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(imageFile)) as string;

    // Get image data
    const imageBitmap: ImageBitmap = await createImageBitmap(imageFile);
    const offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const offscreenCanvasContext = offscreenCanvas.getContext('2d');
    offscreenCanvasContext.drawImage(imageBitmap, 0, 0);
    this.model.sourceImageData = offscreenCanvasContext.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    this.decode();
  }

  decode() {
    const decodingResults: DecodingResults = this.encoderService.decode(this.model.sourceImageData);
    this.model.options = decodingResults.header.options;
    this.model.dataText = EncoderService.uint8ArrayToString(decodingResults.data);

    // Generate URL for download
    const blob: Blob = new Blob([decodingResults.data], { type: 'application/octet-stream' });
    URL.revokeObjectURL(this.model.dataFileURL);
    this.model.dataFileURL = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob)) as string;
  }

}
