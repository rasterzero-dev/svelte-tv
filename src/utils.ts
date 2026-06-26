import { isInteger, type Styles } from './core/index.js';

export type Accessor<T> = () => T;

const WEBGL_CONTEXT_IDS = [
  'webgl2',
  'webgl',
  'experimental-webgl2',
  'experimental-webgl',
];

const supportedWebglVersions = new Map<string, string[]>();

export function hexColor(color: string | number = ''): number {
  if (isInteger(color)) {
    return color;
  }

  if (typeof color === 'string') {
    let hex: string;
    if (color.charCodeAt(0) === 35) {
      hex = color.length === 7 ? color.slice(1) + 'ff' : color.slice(1);
    } else if (color.charCodeAt(0) === 48 && color.charCodeAt(1) === 120) {
      hex = color.slice(2);
    } else {
      hex = color.length === 6 ? color + 'ff' : color;
    }
    return parseInt(hex, 16);
  }

  return 0x00000000;
}

export function combineStyles<T extends Styles>(
  style1: T | undefined,
  style2: T | undefined,
): T {
  if (!style1) return style2!;
  if (!style2) return style1;
  return { ...style2, ...style1 };
}

export function combineStylesMemo<T extends Styles>(
  style1: T | undefined,
  style2: T | undefined,
): Accessor<T> {
  return () => combineStyles(style1, style2);
}

export const clamp = (value: number, min: number, max: number) =>
  min < max
    ? Math.min(Math.max(value, min), max)
    : Math.min(Math.max(value, max), min);

export function mod(n: number, m: number): number {
  if (m === 0) return 0;
  return ((n % m) + m) % m;
}

export function getWebglSupportedVersions(
  webglContextIds: string[] = WEBGL_CONTEXT_IDS,
): string[] {
  const cacheKey = webglContextIds.join('|');
  const cached = supportedWebglVersions.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const cv = document.createElement('canvas');

  let probeContext: RenderingContext | null = null;
  const supports = webglContextIds.filter((id) => {
    try {
      const context = cv.getContext(id);
      if (context !== null && probeContext === null) {
        probeContext = context;
      }
      return !!(
        context &&
        (context instanceof WebGLRenderingContext ||
          context instanceof WebGL2RenderingContext ||
          ('getParameter' in context &&
            typeof context.getParameter === 'function'))
      );
    } catch {
      return false;
    }
  });

  const probe = probeContext as RenderingContext | null;
  if (
    probe !== null &&
    'getExtension' in probe &&
    (probe as WebGLRenderingContext).isContextLost() === false
  ) {
    (probe as WebGLRenderingContext)
      .getExtension('WEBGL_lose_context')
      ?.loseContext();
  }

  supportedWebglVersions.set(cacheKey, supports);

  return supports;
}

export const supportsWebGL = (webGLSupportedVersion: string[]): boolean =>
  ['webgl', 'experimental-webgl', 'webgl2'].some((ver) =>
    webGLSupportedVersion.includes(ver),
  );

export const supportsWebGL2 = (webGLSupportedVersion: string[]): boolean =>
  webGLSupportedVersion.includes('webgl2');

export const supportsOnlyWebGL2 = (webGLSupportedVersion: string[]): boolean =>
  webGLSupportedVersion.includes('webgl2') &&
  !webGLSupportedVersion.includes('webgl') &&
  !webGLSupportedVersion.includes('experimental-webgl');
