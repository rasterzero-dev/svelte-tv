import { get } from 'svelte/store';
import type { ElementNode } from '../../core/index.js';
import { focusPathStore } from '../../core/index.js';
import SpeechEngine, { type SeriesResult, type SpeechType } from './speech.js';

let unsubscribe: (() => void) | undefined;
let previousPath: ElementNode[] = [];
let current: SeriesResult | undefined;

function getElmName(elm: ElementNode): string {
  return (elm.id || elm.name || 'Unknown') as string;
}

function onFocusChange(path: ElementNode[] = []) {
  if (!Announcer.enabled) return;
  const focusDiff = path.filter((elm) => !previousPath.includes(elm));
  previousPath = path.slice();

  const toAnnounce: SpeechType[] = [];
  for (const elm of focusDiff.reverse()) {
    const node = elm as ElementNode & {
      announce?: SpeechType;
      announceContext?: SpeechType;
      title?: SpeechType;
      loading?: boolean;
    };
    if (node.loading) return;
    if (node.announce) toAnnounce.push(node.announce);
    else if (node.title) toAnnounce.push(node.title);
    if (node.announceContext) toAnnounce.push(node.announceContext);
  }

  if (Announcer.debug && toAnnounce.length) {
    console.table(toAnnounce.map((text) => ({ text })));
  }
  if (toAnnounce.length) Announcer.speak(toAnnounce);
}

export const Announcer = {
  debug: false,
  enabled: true,
  lang: 'en-US',
  aria: false,
  cancel() {
    current?.cancel();
  },
  clearPrevFocus(depth = 0) {
    previousPath = previousPath.slice(0, depth);
  },
  speak(text: SpeechType, { append = false } = {}) {
    if (append && current?.active) {
      current.append(text);
    } else {
      current?.cancel();
      current = SpeechEngine(text, Announcer.aria, Announcer.lang);
    }
    return current as SeriesResult;
  },
  refresh(depth = 0) {
    Announcer.clearPrevFocus(depth);
    onFocusChange(get(focusPathStore));
  },
  setup() {
    unsubscribe?.();
    unsubscribe = focusPathStore.subscribe(onFocusChange);
    return () => unsubscribe?.();
  },
};
