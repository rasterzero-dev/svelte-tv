import { GifReader } from 'omggif';

export interface GifFrame {
  pixels: Uint8ClampedArray;
  duration: number;
}

export interface DecodedGif {
  width: number;
  height: number;
  loopCount: number | null;
  frames: GifFrame[];
}

export function isGifSource(src: unknown): src is string {
  return (
    typeof src === 'string' &&
    (/^data:image\/gif[;,]/i.test(src) || /\.gif(?:[?#].*)?$/i.test(src))
  );
}

export async function decodeGif(src: string, signal?: AbortSignal) {
  const response = await fetch(src, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load GIF: ${response.status}`);
  }

  const reader = new GifReader(new Uint8Array(await response.arrayBuffer()));
  const pixels = new Uint8ClampedArray(reader.width * reader.height * 4);
  const frames: GifFrame[] = [];
  let restorePixels: Uint8ClampedArray | undefined;

  for (let index = 0; index < reader.numFrames(); index++) {
    const previous = index > 0 ? reader.frameInfo(index - 1) : undefined;

    if (previous?.disposal === 2) {
      clearFrame(pixels, reader.width, previous);
    } else if (previous?.disposal === 3 && restorePixels) {
      pixels.set(restorePixels);
    }

    const frame = reader.frameInfo(index);
    restorePixels = frame.disposal === 3 ? pixels.slice() : undefined;
    reader.decodeAndBlitFrameRGBA(index, pixels);
    frames.push({
      pixels: pixels.slice(),
      duration: frame.delay > 0 ? frame.delay * 10 : 100,
    });
  }

  return {
    width: reader.width,
    height: reader.height,
    loopCount: reader.loopCount(),
    frames,
  } satisfies DecodedGif;
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
