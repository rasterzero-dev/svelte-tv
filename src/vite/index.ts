import type { Plugin } from 'vite';
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import type { GeneratedFontData, GeneratedFonts } from '../fonts.js';

type SdfFieldType = 'msdf' | 'ssdf';

type CacheInput = {
  path: string;
  size: number;
  mtimeMs: number;
};

type FontCache = {
  version: 1;
  fieldType: SdfFieldType;
  publicPath: string;
  manifest: string | boolean | undefined;
  charsets: FontCharsetMap | undefined;
  inputs: CacheInput[];
};

type FontCharset = {
  charset: string;
  presets?: string[];
};

type FontCharsetMap = Record<string, FontCharset>;

type GeneratedFontManifestEntry = {
  type: SdfFieldType;
  fontFamily: string;
  atlasUrl: string;
  atlasDataUrl: string;
};

type CompactGeneratedFontData = {
  c: Array<[number, number]>;
  k: Array<[number, number, number]>;
  i: [string | undefined, number];
};

export interface SvelteTvFontsOptions {
  input?: string;
  output?: string;
  publicPath?: string;
  fieldType?: SdfFieldType;
  manifest?: string | boolean;
  charsets?: FontCharsetMap;
  charsetFile?: string;
}

const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const GENERATED_FONTS_MODULE_ID = 'svelte-tv/generated-fonts';
const VIRTUAL_GENERATED_FONTS_MODULE_ID = 'virtual:svelte-tv/generated-fonts';
const RESOLVED_GENERATED_FONTS_MODULE_ID = `\0${GENERATED_FONTS_MODULE_ID}`;

function normalizePublicPath(publicPath: string) {
  const normalized = publicPath.replaceAll('\\', '/').replace(/\/+$/, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function stripExtension(fileName: string) {
  return fileName.slice(0, -path.extname(fileName).length);
}

function manifestFileName(manifest: string | boolean | undefined) {
  if (manifest === false) return undefined;
  return typeof manifest === 'string' ? manifest : 'manifest.json';
}

function getFontCharset(fontFileName: string, charsets: FontCharsetMap) {
  return charsets[stripExtension(fontFileName)] ?? charsets['*'];
}

async function readFontFiles(input: string) {
  if (!existsSync(input)) return [];

  const entries = await fs.readdir(input, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => FONT_EXTENSIONS.has(path.extname(fileName)));
}

async function optionalInput(filePath: string) {
  if (!existsSync(filePath)) return undefined;
  const stats = await fs.stat(filePath);
  return {
    path: filePath,
    size: stats.size,
    mtimeMs: stats.mtimeMs,
  };
}

async function createCache(
  input: string,
  fontFiles: string[],
  fieldType: SdfFieldType,
  publicPath: string,
  manifest: string | boolean | undefined,
  charsets: FontCharsetMap | undefined,
  charsetFile: string | undefined,
): Promise<FontCache> {
  const inputs = await Promise.all([
    ...fontFiles.map((fileName) => optionalInput(path.join(input, fileName))),
    optionalInput(path.join(input, 'overrides.json')),
    optionalInput(path.join(input, 'charset.config.json')),
    charsetFile ? optionalInput(charsetFile) : undefined,
  ]);

  return {
    version: 1,
    fieldType,
    publicPath,
    manifest,
    charsets,
    inputs: inputs.filter((entry) => entry !== undefined),
  };
}

async function readCache(cachePath: string) {
  if (!existsSync(cachePath)) return undefined;
  return JSON.parse(await fs.readFile(cachePath, 'utf8')) as FontCache;
}

async function readFontData(filePath: string) {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as GeneratedFontData;
}

function compactFontData(font: GeneratedFontData): CompactGeneratedFontData {
  return {
    c: font.chars.map(({ id, xadvance }) => [id, xadvance]),
    k: font.kernings.map(({ first, second, amount }) => [
      first,
      second,
      amount,
    ]),
    i: [font.info.face, font.info.size],
  };
}

async function outputExists(
  output: string,
  fontFiles: string[],
  fieldType: SdfFieldType,
  manifest: string | boolean | undefined,
) {
  const fileName = manifestFileName(manifest);
  const expected = fontFiles.flatMap((fontFile) => {
    const name = stripExtension(fontFile);
    return [
      path.join(output, `${name}.${fieldType}.json`),
      path.join(output, `${name}.${fieldType}.png`),
    ];
  });

  if (fileName) expected.push(path.join(output, fileName));
  return expected.every((filePath) => existsSync(filePath));
}

function cacheMatches(a: FontCache | undefined, b: FontCache) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function readGeneratedFonts(
  output: string,
  fontFiles: string[],
  fieldType: SdfFieldType,
  publicPath: string,
) {
  const generatedFonts: GeneratedFonts = {};
  const generatedFontManifest: GeneratedFontManifestEntry[] = [];

  for (const fontFile of fontFiles) {
    const name = stripExtension(fontFile);
    const jsonPath = path.join(output, `${name}.${fieldType}.json`);
    const fontData = await readFontData(jsonPath);
    const fontFamily = fontData.info.face ?? name;

    generatedFonts[fontFamily] = fontData;
    generatedFontManifest.push({
      type: fieldType,
      fontFamily,
      atlasUrl: `${publicPath}/${name}.${fieldType}.png`,
      atlasDataUrl: `${publicPath}/${name}.${fieldType}.json`,
    });
  }

  return { generatedFonts, generatedFontManifest };
}

export function svelteTvFonts(options: SvelteTvFontsOptions = {}): Plugin {
  let root = '';
  let publicDir = '';
  let cacheDir = '';
  let generated = false;
  let generatedFonts: GeneratedFonts = {};
  let generatedFontManifest: GeneratedFontManifestEntry[] = [];

  async function generateFonts() {
    if (generated) return;
    const input = path.resolve(root, options.input ?? 'src/fonts');
    const output = options.output
      ? path.resolve(root, options.output)
      : path.resolve(publicDir, 'generated/fonts');
    const publicPath = normalizePublicPath(
      options.publicPath ?? '/generated/fonts',
    );
    const fieldType = options.fieldType ?? 'msdf';
    const charsetFile = options.charsetFile
      ? path.resolve(root, options.charsetFile)
      : undefined;
    const cacheRoot = path.join(cacheDir, 'svelte-tv-fonts');
    const charsetDir = path.join(cacheRoot, 'charsets');
    const fontFiles = await readFontFiles(input);

    if (fontFiles.length === 0) return;

    const cachePath = path.join(cacheRoot, 'cache.json');
    const cache = await createCache(
      input,
      fontFiles,
      fieldType,
      publicPath,
      options.manifest,
      options.charsets,
      charsetFile,
    );

    if (
      cacheMatches(await readCache(cachePath), cache) &&
      (await outputExists(output, fontFiles, fieldType, options.manifest))
    ) {
      ({ generatedFonts, generatedFontManifest } = await readGeneratedFonts(
        output,
        fontFiles,
        fieldType,
        publicPath,
      ));
      generated = true;
      return;
    }

    const { genFont, setGeneratePaths } =
      await import('@lightningjs/msdf-generator');

    const fonts = [];
    for (const fileName of fontFiles) {
      const fontCharset = options.charsets
        ? getFontCharset(fileName, options.charsets)
        : undefined;
      let fontCharsetFile = charsetFile;

      if (fontCharset) {
        await fs.mkdir(charsetDir, { recursive: true });
        fontCharsetFile = path.join(
          charsetDir,
          `${stripExtension(fileName)}.json`,
        );
        await fs.writeFile(
          fontCharsetFile,
          `${JSON.stringify(fontCharset, null, 2)}\n`,
        );
      }

      setGeneratePaths(input, output, fontCharsetFile);
      const font = await genFont(fileName, fieldType);
      if (font) fonts.push(font);
    }

    const manifest = fonts.map((font) => ({
      type: font.fieldType,
      fontFamily: font.fontName,
      atlasUrl: `${publicPath}/${path.basename(font.pngPath)}`,
      atlasDataUrl: `${publicPath}/${path.basename(font.jsonPath)}`,
    }));

    const fileName = manifestFileName(options.manifest);
    if (fileName) {
      await fs.mkdir(output, { recursive: true });
      await fs.writeFile(
        path.join(output, fileName),
        `${JSON.stringify(manifest, null, 2)}\n`,
      );
    }
    ({ generatedFonts, generatedFontManifest } = await readGeneratedFonts(
      output,
      fontFiles,
      fieldType,
      publicPath,
    ));
    await fs.mkdir(cacheRoot, { recursive: true });
    await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
    generated = true;
  }

  return {
    name: 'svelte-tv-fonts',
    async configResolved(config) {
      root = config.root;
      publicDir = config.publicDir;
      cacheDir = config.cacheDir;
      await generateFonts();
    },
    async buildStart() {
      await generateFonts();
    },
    resolveId(id) {
      if (
        id === GENERATED_FONTS_MODULE_ID ||
        id === VIRTUAL_GENERATED_FONTS_MODULE_ID
      ) {
        return RESOLVED_GENERATED_FONTS_MODULE_ID;
      }
    },
    async load(id) {
      if (id !== RESOLVED_GENERATED_FONTS_MODULE_ID) return;

      await generateFonts();

      const compactFonts: Record<string, CompactGeneratedFontData> = {};
      for (const [fontFamily, font] of Object.entries(generatedFonts)) {
        compactFonts[fontFamily] = compactFontData(font);
      }

      return [
        `const compactFonts = ${JSON.stringify(compactFonts)};`,
        'const generatedFonts = {};',
        'for (const fontFamily in compactFonts) {',
        '  const font = compactFonts[fontFamily];',
        '  generatedFonts[fontFamily] = {',
        '    chars: font.c.map(([id, xadvance]) => ({ id, xadvance })),',
        '    kernings: font.k.map(([first, second, amount]) => ({ first, second, amount })),',
        '    info: { ...(font.i[0] ? { face: font.i[0] } : {}), size: font.i[1] },',
        '  };',
        '}',
        'export { generatedFonts };',
        `export const generatedFontManifest = ${JSON.stringify(generatedFontManifest)};`,
      ].join('\n');
    },
  };
}

export default svelteTvFonts;
