import { Injectable } from '@angular/core';

import {
  BrowserMultiFormatReader,
  IScannerControls
} from '@zxing/browser';

import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException
} from '@zxing/library';

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {

  private readonly hints = new Map();

  private readonly reader: BrowserMultiFormatReader;

  private controls?: IScannerControls;

  constructor() {
    this.hints.set(DecodeHintType.TRY_HARDER, true);

    this.hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE
    ]);

    this.reader = new BrowserMultiFormatReader(this.hints);
  }

  async startScanner(
    videoElement: HTMLVideoElement,
    onDetected: (barcode: string) => void,
    onError: (message: string) => void
  ): Promise<void> {

    try {
      this.controls = await this.reader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, error, controls) => {

          if (result) {
            const barcode = result.getText();

            console.log('Barcode detected:', barcode);

            onDetected(barcode);

            controls.stop();
            this.controls = undefined;

            return;
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error('Barcode scanning error:', error);
          }
        }
      );

    } catch (error) {
      console.error('Camera error:', error);

      onError(
        'Unable to access camera. Please check camera permissions.'
      );
    }
  }

  stopScanner(): void {
    this.controls?.stop();
    this.controls = undefined;
  }
}