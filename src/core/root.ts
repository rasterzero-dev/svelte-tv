import type { RendererMain, RendererMainSettings } from '@lightningjs/renderer';
import { ElementNode } from './elementNode.js';
import { startLightningRenderer } from './lightningInit.js';
import { Config } from './config.js';

export const rootNode = new ElementNode('App');

export function createRenderer(
  rendererOptions?: Partial<RendererMainSettings>,
  node?: HTMLElement | string,
): { renderer: RendererMain; rootNode: ElementNode } {
  const options = rendererOptions || Config.rendererOptions || {};
  const renderer = startLightningRenderer(options, node || 'app');
  rootNode.lng = renderer.root!;
  rootNode.rendered = true;
  return { renderer, rootNode };
}

export function attachRootNode(renderer: RendererMain) {
  rootNode.lng = renderer.root!;
  rootNode.rendered = true;
  return rootNode;
}
