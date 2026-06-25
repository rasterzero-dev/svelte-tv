<script lang="ts" generics="T">
  import View from '../View.svelte';
  import {
    clamp,
    combineStyles,
    ElementNode,
    hasFocus,
    mod,
    type KeyHandler,
    type NodeProps,
    type NodeStyles,
  } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import { chainFunctions } from './utils/chainFunctions.js';
  import {
    defaultTransitionBack,
    defaultTransitionDown,
    defaultTransitionForward,
    defaultTransitionUp,
    navigableForwardFocus,
  } from './utils/handleNavigation.js';
  import type { NavigableElement, OnSelectedChanged } from './types.js';

  interface VirtualItemProps<T> {
    item: T;
    index: number;
  }

  interface Props extends NodeProps {
    each: readonly T[] | undefined | null | false;
    displaySize: number;
    bufferSize?: number;
    orientation?: 'row' | 'column';
    selected?: number;
    scrollIndex?: number;
    wrap?: boolean;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    onSelectedChanged?: OnSelectedChanged;
    children: (props: VirtualItemProps<T>) => any;
  }

  let props: Props = $props();
  let view: LightningComponent | undefined;
  let cursor = $state(0);

  const items = $derived(props.each || []);
  const bufferSize = $derived(props.bufferSize ?? 2);
  const orientation = $derived(props.orientation ?? 'row');
  const isRow = $derived(orientation === 'row');
  const scrollIndex = $derived(props.scrollIndex ?? bufferSize);
  const windowSize = $derived(props.displaySize + bufferSize * 2);
  const maxCursor = $derived(Math.max(0, items.length - 1));
  const safeCursor = $derived(clamp(cursor, 0, maxCursor));
  const start = $derived.by(() => {
    if (items.length <= windowSize) return 0;
    return clamp(
      safeCursor - scrollIndex,
      0,
      Math.max(0, items.length - windowSize),
    );
  });
  const slice = $derived(items.slice(start, start + windowSize));

  const virtualStyles = $derived<NodeStyles>(
    isRow
      ? {
          display: 'flex',
          gap: 30,
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
        },
  );
  const relativeSelected = $derived(
    clamp(safeCursor - start, 0, slice.length - 1),
  );

  export function getElement() {
    return view?.element;
  }

  export function setFocus() {
    getElement()?.setFocus();
  }

  export function scrollToIndex(index: number) {
    selectIndex(index, true);
  }

  function focusSelected() {
    const element = getElement();
    if (!element) return;
    element.selected = relativeSelected;
    element.children[relativeSelected]?.setFocus();
  }

  function selectIndex(index: number, forceFocus = false) {
    if (!items.length) return false;
    const next = props.wrap
      ? mod(index, items.length)
      : clamp(index, 0, maxCursor);
    cursor = next;

    if (
      props.onEndReachedThreshold !== undefined &&
      next >= items.length - props.onEndReachedThreshold
    ) {
      props.onEndReached?.();
    }

    queueMicrotask(() => {
      const element = getElement();
      if (!element) return;
      const lastSelected = element.selected;
      element.updateLayout();
      element.selected = relativeSelected;
      const active = element.children[relativeSelected];
      if (active instanceof ElementNode) {
        if (forceFocus || hasFocus(element)) {
          active.setFocus();
        }
        const navigable = element as NavigableElement;
        props.onSelectedChanged?.call(
          navigable,
          next,
          navigable,
          active,
          lastSelected,
        );
      }
    });

    return true;
  }

  function move(delta: number) {
    if (!items.length) return false;
    const next = safeCursor + delta;
    if (!props.wrap && (next < 0 || next > maxCursor)) return false;
    return selectIndex(next);
  }

  const onBack: KeyHandler = () => move(-1);
  const onForward: KeyHandler = () => move(1);

  $effect(() => {
    if (props.selected !== undefined) {
      cursor = props.selected;
    }
  });

  $effect(() => {
    if (!items.length) {
      cursor = 0;
    } else if (cursor > maxCursor) {
      cursor = maxCursor;
    }
  });

  const nodeProps = $derived.by(() => {
    const {
      each,
      displaySize,
      bufferSize,
      orientation,
      selected,
      scrollIndex,
      wrap,
      onEndReached,
      onEndReachedThreshold,
      onSelectedChanged,
      children,
      ...rest
    } = props;
    return rest;
  });
</script>

<View
  bind:this={view}
  {...nodeProps}
  selected={relativeSelected}
  cursor={safeCursor}
  transitionLeft={isRow ? defaultTransitionBack : undefined}
  transitionRight={isRow ? defaultTransitionForward : undefined}
  transitionUp={isRow ? undefined : defaultTransitionUp}
  transitionDown={isRow ? undefined : defaultTransitionDown}
  onLeft={isRow ? chainFunctions(onBack, props.onLeft) : props.onLeft}
  onRight={isRow ? chainFunctions(onForward, props.onRight) : props.onRight}
  onUp={isRow ? props.onUp : chainFunctions(onBack, props.onUp)}
  onDown={isRow ? props.onDown : chainFunctions(onForward, props.onDown)}
  forwardFocus={navigableForwardFocus}
  {scrollToIndex}
  onFocus={chainFunctions(props.onFocus, focusSelected)}
  style={combineStyles(props.style, virtualStyles)}
>
  {#each slice as item, index}
    {@render props.children({ item, index: start + index })}
  {/each}
</View>
