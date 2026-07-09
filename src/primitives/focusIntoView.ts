import { ElementNode, type AnimationSettings } from '../core/index.js';
import type { LightningComponent } from '../core/svelteNode.js';

type FocusTarget = ElementNode | LightningComponent | undefined;

export interface FocusIntoViewOptions {
  container: FocusTarget;
  axis?: 'x' | 'y';
  align?: 'start' | 'center' | 'end';
  viewportSize?: number;
  offset?: number;
  transition?: AnimationSettings;
  focus?: boolean;
}

function getElement(target: FocusTarget) {
  if (!target) return;
  if (target instanceof ElementNode) return target;
  return target.getElement?.() ?? target.element;
}

function getOffset(
  target: ElementNode,
  container: ElementNode,
  axis: 'x' | 'y',
) {
  let offset = 0;
  let current: ElementNode | undefined = target;

  while (current && current !== container) {
    offset += current[axis] || 0;
    current = current.parent;
  }

  return current === container ? offset : target[axis] || 0;
}

export function focusIntoView(
  target: FocusTarget,
  options: FocusIntoViewOptions,
) {
  const targetElement = getElement(target);
  const containerElement = getElement(options.container);

  if (!targetElement || !containerElement) return false;

  const axis = options.axis ?? 'y';
  const sizeKey = axis === 'y' ? 'height' : 'width';
  const viewportSize =
    options.viewportSize ?? containerElement.parent?.[sizeKey] ?? 0;
  const targetOffset = getOffset(targetElement, containerElement, axis);
  const targetSize = targetElement[sizeKey] || 0;
  const inset = options.offset ?? 0;
  let nextPosition: number;

  if (options.align === 'start') {
    nextPosition = inset - targetOffset;
  } else if (options.align === 'end') {
    nextPosition = viewportSize - inset - targetOffset - targetSize;
  } else {
    nextPosition = viewportSize / 2 - (targetOffset + targetSize / 2) + inset;
  }

  if (options.transition) {
    containerElement
      .animate({ [axis]: nextPosition }, options.transition)
      .start();
  } else {
    containerElement[axis] = nextPosition;
  }

  if (options.focus !== false) {
    targetElement.setFocus();
  }

  return true;
}
