import { describe, expect, it } from 'vitest';
import { createFontMetrics, measureFontText } from '../src/fonts.js';

const font = {
  chars: [
    { id: 63, xadvance: 5 },
    { id: 65, xadvance: 10 },
    { id: 86, xadvance: 12 },
  ],
  kernings: [{ first: 65, second: 86, amount: -2 }],
  info: { size: 20 },
};

describe('fonts', () => {
  it('measures generated font text with scale and kerning', () => {
    const metrics = createFontMetrics(font, 40);

    expect(measureFontText('AV', metrics)).toBe(40);
  });

  it('uses question mark as a fallback glyph', () => {
    const metrics = createFontMetrics(font, 20);

    expect(measureFontText('A~', metrics)).toBe(15);
  });
});
