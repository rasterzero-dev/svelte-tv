import type { Snippet } from 'svelte';
import { getContext, setContext } from 'svelte';
import {
  ElementNode,
  enqueueDelete,
} from './elementNode.js';
import type { ElementText, NodeProps, TextProps } from './intrinsicTypes.js';
import { TextNode } from './nodeTypes.js';
import { isElementText } from './utils.js';

const nodeContext = Symbol('svelte-tv-node');

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

export function mountNode(node: ElementNode, parent: ElementNode | undefined) {
  if (!parent) return;
  parent.insertChild(node);
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

  for (const [key, value] of Object.entries(props)) {
    if (
      key === 'children' ||
      key === '$$slots' ||
      key === '$$events' ||
      key.startsWith('$$')
    ) {
      continue;
    }

    if (value !== undefined) {
      if (node._stateStyleFallbacks && key in node._stateStyleFallbacks) {
        node._stateStyleFallbacks[key] = value;
        reapplyState = true;
      }
      if (key === 'style') {
        reapplyState = true;
      }
      node[key] = value;
    }
  }
  if (reapplyState && node._states?.length) {
    node._stateChanged();
  }
  node.rerender();
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
