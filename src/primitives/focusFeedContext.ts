import { getContext, setContext } from 'svelte';
import type { AnimationSettings, ElementNode } from '../core/index.js';

export interface FocusFeedItem {
  id: string;
  getElement: () => ElementNode | undefined;
  setFocus: () => boolean | void;
}

export interface FocusFeedContext {
  align: 'start' | 'center' | 'end';
  viewportSize: number;
  scrollTransition?: AnimationSettings;
  register: (item: FocusFeedItem) => () => void;
  focusItem: (id: string) => boolean;
  focusNext: (fromId?: string) => boolean;
  focusPrevious: (fromId?: string) => boolean;
  setCurrentId: (id: string) => void;
}

const focusFeedContext = Symbol('svelte-tv-focus-feed');

export function setFocusFeedContext(context: FocusFeedContext) {
  setContext(focusFeedContext, context);
}

export function getFocusFeedContext() {
  return getContext<FocusFeedContext | undefined>(focusFeedContext);
}
