declare module 'omggif' {
  export interface GifFrameInfo {
    x: number;
    y: number;
    width: number;
    height: number;
    delay: number;
    disposal: number;
  }

  export class GifReader {
    constructor(buffer: Uint8Array);
    width: number;
    height: number;
    numFrames(): number;
    loopCount(): number | null;
    frameInfo(frameNumber: number): GifFrameInfo;
    decodeAndBlitFrameRGBA(
      frameNumber: number,
      pixels: Uint8ClampedArray,
    ): void;
  }

  export class GifWriter {
    constructor(
      buffer: Uint8Array,
      width: number,
      height: number,
      options?: { loop?: number; palette?: number[] },
    );
    addFrame(
      x: number,
      y: number,
      width: number,
      height: number,
      indexedPixels: number[],
      options?: {
        palette?: number[];
        delay?: number;
        disposal?: number;
        transparent?: number;
      },
    ): number;
    end(): number;
  }
}
