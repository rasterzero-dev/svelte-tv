<script lang="ts" generics="T">
  import View from '../View.svelte';
  import {
    ElementNode,
    hasFocus,
    type KeyHandler,
    type NodeProps,
  } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import { chainFunctions } from './utils/chainFunctions.js';

  interface GridItemProps<T> {
    item: T;
    index: number;
    width: number;
    height: number;
    x: number;
    y: number;
  }

  interface Props extends NodeProps {
    items: readonly T[];
    children: (props: GridItemProps<T>) => any;
    itemHeight?: number;
    itemWidth?: number;
    itemOffset?: number;
    columns?: number;
    looping?: boolean;
    scroll?: 'auto' | 'none';
    selected?: number;
    onSelectedChanged?: (
      index: number,
      grid: ElementNode,
      elm?: ElementNode,
    ) => void;
  }

  let props: Props = $props();
  let focusedIndex = $state(0);
  let grid: LightningComponent | undefined;
  let gridRef = $derived(grid?.element);

  const itemWidth = () => props.itemWidth ?? 300;
  const itemHeight = () => props.itemHeight ?? 300;
  const columns = () => props.columns || 4;
  const totalWidth = () => itemWidth() + (props.itemOffset ?? 0);
  const totalHeight = () => itemHeight() + (props.itemOffset ?? 0);
  const rows = () => Math.ceil(props.items.length / columns());

  function focus() {
    if (!gridRef) return false;
    const focusedElm = gridRef.children[focusedIndex];
    if (focusedElm instanceof ElementNode && !hasFocus(focusedElm)) {
      focusedElm.setFocus();
      props.onSelectedChanged?.(focusedIndex, gridRef, focusedElm);
      return true;
    }
    return false;
  }

  function moveFocus(delta: number) {
    if (!props.items.length) return false;
    const next = focusedIndex + delta;
    if (next >= 0 && next < props.items.length) {
      focusedIndex = next;
    } else if (props.looping) {
      const totalItems = props.items.length;
      if (delta < 0) {
        const lastRowStart =
          totalItems - (totalItems % columns()) || totalItems - columns();
        const target = lastRowStart + (focusedIndex % columns());
        focusedIndex = target < totalItems ? target : target - columns();
      } else {
        focusedIndex = focusedIndex % columns();
      }
    } else {
      return false;
    }
    return focus();
  }

  function handleHorizontalFocus(delta: number) {
    if (!props.items.length) return false;
    const next = focusedIndex + delta;
    const sameRow =
      Math.floor(next / columns()) === Math.floor(focusedIndex / columns());

    if (next >= 0 && next < props.items.length && sameRow) {
      focusedIndex = next;
    } else if (props.looping) {
      const rowStart = Math.floor(focusedIndex / columns()) * columns();
      const rowEnd = Math.min(rowStart + columns() - 1, props.items.length - 1);
      focusedIndex =
        delta > 0
          ? next > rowEnd
            ? rowStart
            : next
          : next < rowStart
            ? rowEnd
            : next;
    } else {
      return false;
    }
    return focus();
  }

  export function scrollToIndex(index: number) {
    if (!props.items.length || !gridRef) return;
    if (!hasFocus(gridRef)) {
      gridRef.setFocus();
    }
    focusedIndex = Math.max(0, Math.min(index, props.items.length - 1));
    queueMicrotask(focus);
  }

  const onUp: KeyHandler = () => moveFocus(-columns());
  const onDown: KeyHandler = () => moveFocus(columns());
  const onLeft: KeyHandler = () => handleHorizontalFocus(-1);
  const onRight: KeyHandler = () => handleHorizontalFocus(1);
  const onFocus = () => handleHorizontalFocus(0);

  export function getElement() {
    return gridRef;
  }

  export function setFocus() {
    gridRef?.setFocus();
  }

  $effect(() => {
    if (props.selected !== undefined) {
      focusedIndex = props.selected;
    }
  });

  const nodeProps = $derived.by(() => {
    const {
      children,
      items,
      itemHeight,
      itemWidth,
      itemOffset,
      columns,
      looping,
      scroll,
      selected,
      onSelectedChanged,
      ...rest
    } = props;
    return rest;
  });
</script>

<View
  bind:this={grid}
  {...nodeProps}
  transition={{ y: true }}
  height={totalHeight() * rows()}
  {scrollToIndex}
  onUp={chainFunctions(onUp, props.onUp)}
  onDown={chainFunctions(onDown, props.onDown)}
  onLeft={chainFunctions(onLeft, props.onLeft)}
  onRight={chainFunctions(onRight, props.onRight)}
  onFocus={chainFunctions(props.onFocus, onFocus)}
  strictBounds={false}
  y={props.scroll === 'none'
    ? (props.y ?? 0)
    : -Math.floor(focusedIndex / columns()) * totalHeight() + (props.y || 0)}
>
  {#each props.items as item, index}
    {@render props.children({
      item,
      index,
      width: itemWidth(),
      height: itemHeight(),
      x: (index % columns()) * totalWidth(),
      y: Math.floor(index / columns()) * totalHeight(),
    })}
  {/each}
</View>
