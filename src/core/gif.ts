import { GifReader } from 'omggif';

export interface GifFrame {
  pixels: Uint8ClampedArray;
  duration: number;
}

export interface DecodedGif {
  width: number;
  height: number;
  loopCount: number | null;
  frameCount: number;
  decodeFrame(index: number): GifFrame;
}

export function isGifSource(src: unknown): src is string {
  return (
    typeof src === 'string' &&
    (/^data:image\/gif[;,]/i.test(src) || /\.gif(?:[?#].*)?$/i.test(src))
  );
}

export async function decodeGif(src: string) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to load GIF: ${response.status}`);
  }

  return new GifDecoder(
    new GifReader(new Uint8Array(await response.arrayBuffer())),
  );
}

class GifDecoder implements DecodedGif {
  readonly width: number;
  readonly height: number;
  readonly loopCount: number | null;
  readonly frameCount: number;
  private readonly pixels: Uint8ClampedArray;
  private frameIndex = -1;
  private restorePixels: Uint8ClampedArray | undefined;

  constructor(private readonly reader: GifReader) {
    this.width = reader.width;
    this.height = reader.height;
    this.loopCount = reader.loopCount();
    this.frameCount = reader.numFrames();
    this.pixels = new Uint8ClampedArray(this.width * this.height * 4);
  }

  decodeFrame(index: number) {
    if (index === 0 && this.frameIndex !== -1) {
      this.pixels.fill(0);
      this.restorePixels = undefined;
      this.frameIndex = -1;
    }

    if (index !== this.frameIndex + 1) {
      throw new Error('GIF frames must be decoded in order');
    }

    if (this.frameIndex >= 0) {
      const previous = this.reader.frameInfo(this.frameIndex);
      if (previous.disposal === 2) {
        clearFrame(this.pixels, this.width, previous);
      } else if (previous.disposal === 3 && this.restorePixels) {
        this.pixels.set(this.restorePixels);
      }
    }

    const frame = this.reader.frameInfo(index);
    this.restorePixels = frame.disposal === 3 ? this.pixels.slice() : undefined;
    this.reader.decodeAndBlitFrameRGBA(index, this.pixels);
    this.frameIndex = index;

    return {
      pixels: this.pixels.slice(),
      duration: frame.delay > 0 ? frame.delay * 10 : 100,
    };
  }
}

function clearFrame(
  pixels: Uint8ClampedArray,
  width: number,
  frame: ReturnType<GifReader['frameInfo']>,
) {
  for (let y = frame.y; y < frame.y + frame.height; y++) {
    const start = (y * width + frame.x) * 4;
    pixels.fill(0, start, start + frame.width * 4);
  }
}
