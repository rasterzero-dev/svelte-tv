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
    });
    expect(gif.frames.map((frame) => frame.duration)).toEqual([50, 100]);
    expect(Array.from(gif.frames[0]!.pixels)).toEqual([255, 0, 0, 255]);
    expect(Array.from(gif.frames[1]!.pixels)).toEqual([0, 0, 255, 255]);
  });
});
