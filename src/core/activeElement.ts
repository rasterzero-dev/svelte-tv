import { get, writable } from 'svelte/store';
import type { ElementNode } from './elementNode.js';

export const activeElementStore = writable<ElementNode | undefined>(undefined);

export const activeElement = Object.assign(
  () => get(activeElementStore),
  activeElementStore,
);

export function setActiveElement(elm: ElementNode | undefined) {
  activeElementStore.set(elm);
}
