import { FontLoadOptions } from './core/intrinsicTypes.js';
import { loadFonts } from './core/lightningInit.js';

export type GeneratedFontManifest = FontLoadOptions[];
export type GeneratedFonts = Record<string, GeneratedFontData>;

export interface GeneratedFontData {
  chars: Array<{
    id: number;
    xadvance: number;
  }>;
  kernings: Array<{
    first: number;
    second: number;
    amount: number;
  }>;
  info: {
    face?: string;
    size: number;
  };
}

export interface MeasureFontTextOptions {
  letterSpacing?: number;
}

export async function loadGeneratedFonts(
  manifest: GeneratedFontManifest | string = '/generated/fonts/manifest.json',
) {
  const fonts =
    typeof manifest === 'string'
      ? ((await fetch(manifest).then((response) =>
          response.json(),
        )) as GeneratedFontManifest)
      : manifest;

  return loadFonts(fonts);
}

export function createFontMetrics(font: GeneratedFontData, fontSize: number) {
  return {
    scale: fontSize / font.info.size,
    chars: new Map(font.chars.map((char) => [char.id, char.xadvance])),
    kernings: new Map(
      font.kernings.map((kerning) => [
        `${kerning.first}:${kerning.second}`,
        kerning.amount,
      ]),
    ),
  };
}

export function measureFontText(
  text: string | undefined,
  metrics: ReturnType<typeof createFontMetrics>,
  options: MeasureFontTextOptions = {},
) {
  const letterSpacing = (options.letterSpacing ?? 0) / metrics.scale;
  let previous = 0;
  let width = 0;

  for (const char of text || '') {
    // zero width char
    if (char === '\u200B') continue;

    const code = char.codePointAt(0);
    if (code === undefined) continue;

    // question mark
    const glyph = metrics.chars.has(code)
      ? code
      : metrics.chars.has(63)
        ? 63
        : undefined;

    if (glyph === undefined) continue;

    const kerning = previous
      ? metrics.kernings.get(`${previous}:${glyph}`) || 0
      : 0;

    width += metrics.chars.get(glyph)! + kerning + letterSpacing;
    previous = glyph;
  }

  return Math.ceil(width * metrics.scale);
}
