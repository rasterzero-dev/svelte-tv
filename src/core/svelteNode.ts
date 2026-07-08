import type { Snippet } from 'svelte';
import { getContext, setContext } from 'svelte';
import { active_effect } from 'svelte/internal/client';
import {
  ElementNode,
  enqueueDelete,
  invalidateRoundedClipTree,
} from './elementNode.js';
import type { ElementText, NodeProps, TextProps } from './intrinsicTypes.js';
import { TextNode } from './nodeTypes.js';
import { isElementText } from './utils.js';

const nodeContext = Symbol('svelte-tv-node');

interface SvelteEffect {
  parent: SvelteEffect | null;
  prev: SvelteEffect | null;
}

export interface SvelteNodeProps extends NodeProps {
  children?: Snippet;
}

export interface SvelteTextProps extends Omit<TextProps, 'children'> {
  children?: Snippet;
}

export interface LightningComponent {
  readonly element?: ElementNode;
  getElement?: () => ElementNode | undefined;
  setFocus: () => void;
}

export function getParentNode() {
  return getContext<ElementNode | undefined>(nodeContext);
}

export function setParentNode(node: ElementNode) {
  setContext(nodeContext, node);
}

export function createNode(name: 'view' | 'text', props: Record<string, any>) {
  const node = new ElementNode(name);
  applyNodeProps(node, props);
  return node;
}

export function mountNode(
  node: ElementNode,
  parent: ElementNode | undefined,
  effect: unknown = active_effect,
) {
  if (!parent) return;
  node._svelteEffect = effect;
  parent.insertChild(node, findNextSibling(node, parent));
  if (parent.rendered) {
    node.render(true);
  }
}

export function unmountNode(node: ElementNode) {
  const parent = node.parent;
  if (!parent) return;
  parent.removeChild(node);
  enqueueDelete(node, -1);
}

export function applyNodeProps(node: ElementNode, props: Record<string, any>) {
  let reapplyState = false;
  let changed = false;
  const appliedProps = (node._appliedProps = node._appliedProps || {});

  for (const [key, value] of Object.entries(props)) {
    if (
      key === 'children' ||
      key === '$$slots' ||
      key === '$$events' ||
      key.startsWith('$$')
    ) {
      continue;
    }

    if (value === undefined) {
      delete appliedProps[key];
      continue;
    }

    if (appliedProps[key] === value) {
      continue;
    }
    appliedProps[key] = value;
    changed = true;
    if (node._stateStyleFallbacks && key in node._stateStyleFallbacks) {
      node._stateStyleFallbacks[key] = value;
      reapplyState = true;
    }
    if (key === 'style') {
      reapplyState = true;
    }
    if (key === 'clipping') {
      invalidateRoundedClipTree();
    }
    node[key] = value;
  }
  if (reapplyState && node._states?.length) {
    node._stateChanged();
  }
  if (changed) {
    node.rerender();
  }
}

function findNextSibling(node: ElementNode, parent: ElementNode) {
  const effect = node._svelteEffect;
  if (!isSvelteEffect(effect)) return undefined;

  for (const child of parent.children) {
    if (
      isSvelteEffect(child._svelteEffect) &&
      isEffectBefore(effect, child._svelteEffect)
    ) {
      return child;
    }
  }
}

function isEffectBefore(a: SvelteEffect, b: SvelteEffect) {
  if (a === b) return false;

  const aPath = effectPath(a);
  const bPath = effectPath(b);
  let index = 0;

  while (aPath[index] && aPath[index] === bPath[index]) {
    index++;
  }

  const aChild = aPath[index];
  const bChild = bPath[index];
  if (!aChild || !bChild) return false;

  let sibling = bChild.prev;
  while (sibling) {
    if (sibling === aChild) return true;
    sibling = sibling.prev;
  }

  return false;
}

function effectPath(effect: SvelteEffect) {
  const path: SvelteEffect[] = [];
  let current: SvelteEffect | null = effect;

  while (current) {
    path.unshift(current);
    current = current.parent;
  }

  return path;
}

function isSvelteEffect(value: unknown): value is SvelteEffect {
  if (!value || typeof value !== 'object') return false;

  const effect = value as SvelteEffect;
  return (
    'parent' in effect &&
    (effect.parent === null || typeof effect.parent === 'object') &&
    'prev' in effect &&
    (effect.prev === null || typeof effect.prev === 'object')
  );
}

export function setTextContent(node: ElementNode, text: string | undefined) {
  if (!isElementText(node)) return;
  const textNode = node as ElementText;
  const value = text ?? '';
  if (textNode.children[0]?.text === value) {
    return;
  }
  textNode.children.length = 0;
  const child = new TextNode(value);
  child.parent = textNode;
  textNode.children.push(child);
  if (node.rendered) {
    node.text = value;
  }
}
