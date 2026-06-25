import { FontLoadOptions } from './core/intrinsicTypes.js';
import { loadFonts } from './core/lightningInit.js';

export type GeneratedFontManifest = FontLoadOptions[];

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

