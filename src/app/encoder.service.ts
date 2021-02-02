import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncoderService {

  constructor() { }

  public encodeFile(source: ImageData, data: File): ImageData {
    // TODO
    return source;
  }

  public encodeRandom(source: ImageData): ImageData {
    // TODO
    return source;
  }

  public encodeString(source: ImageData, data: string): ImageData {
    // TODO
    return source;
  }
}
