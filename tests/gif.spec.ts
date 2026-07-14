import { GifWriter } from 'omggif';
import { describe, expect, it } from 'vitest';
import { decodeGif, isGifSource } from '../src/core/gif.js';

describe('GIF support', () => {
  it('recognizes GIF URLs and data URLs', () => {
    expect(isGifSource('/images/loading.GIF?version=1')).toBe(true);
    expect(isGifSource('data:image/gif;base64,R0lGODlh')).toBe(true);
    expect(isGifSource('/images/loading.png')).toBe(false);
  });

  it('decodes animation frames and timing', async () => {
    const buffer = new Uint8Array(256);
    const writer = new GifWriter(buffer, 1, 1, {
      loop: 1,
      palette: [0xff0000, 0x0000ff],
    });
    writer.addFrame(0, 0, 1, 1, [0], { delay: 5 });
    writer.addFrame(0, 0, 1, 1, [1], { delay: 10 });
    const bytes = buffer.slice(0, writer.end());
    const src = `data:image/gif;base64,${Buffer.from(bytes).toString('base64')}`;

    const gif = await decodeGif(src);

    expect(gif).toMatchObject({
      width: 1,
      height: 1,
      loopCount: 1,
      frameCount: 2,
    });
    const firstFrame = gif.decodeFrame(0);
    const secondFrame = gif.decodeFrame(1);
    const repeatedFirstFrame = gif.decodeFrame(0);

    expect([firstFrame.duration, secondFrame.duration]).toEqual([50, 100]);
    expect(Array.from(firstFrame.pixels)).toEqual([255, 0, 0, 255]);
    expect(Array.from(secondFrame.pixels)).toEqual([0, 0, 255, 255]);
    expect(Array.from(repeatedFirstFrame.pixels)).toEqual([255, 0, 0, 255]);
  });
});
