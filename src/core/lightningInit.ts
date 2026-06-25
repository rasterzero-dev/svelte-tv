import * as lng from '@lightningjs/renderer';
import { CanvasRenderer, CanvasTextRenderer } from '@lightningjs/renderer/canvas';
import { FontLoadOptions } from './intrinsicTypes.js';
import { registerDefaultShaders } from './shaders.js';

export type SdfFontType = 'ssdf' | 'msdf';
export let renderer: lng.RendererMain;

export const getRenderer = () => renderer as lng.RendererMain | undefined;

export function startLightningRenderer(
  options: Partial<lng.RendererMainSettings>,
  rootId: string | HTMLElement = 'app',
) {
  renderer = new lng.RendererMain(
    {
      renderEngine: CanvasRenderer,
      fontEngines: [CanvasTextRenderer],
      ...options,
    },
    rootId,
  );
  registerDefaultShaders(renderer.stage.shManager);
  return renderer;
}

export async function loadFonts(fonts: FontLoadOptions[]) {
  const currentRenderer = getRenderer();
  if (!currentRenderer) return;

  const hasCanvas =
    'textRenderers' in currentRenderer.stage &&
    !!(currentRenderer.stage as lng.Stage).textRenderers.canvas;

  await Promise.all(
    fonts.map((font) => {
      if (
        currentRenderer.stage.renderer.mode === 'webgl' &&
        'type' in font &&
        (font.type === 'msdf' || font.type === 'ssdf')
      ) {
        return currentRenderer.stage.loadFont('sdf', font);
      }

      if ('fontUrl' in font && hasCanvas) {
        return currentRenderer.stage.loadFont('canvas', font);
      }
    }),
  );
}
