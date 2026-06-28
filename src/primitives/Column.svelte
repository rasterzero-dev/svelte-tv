<script lang="ts">
  import View from '../View.svelte';
  import {
    combineStyles,
    type ElementNode,
    type NodeStyles,
  } from '../index.js';
  import type { ColumnProps } from './types.js';
  import { chainFunctions } from './utils/chainFunctions.js';
  import {
    defaultTransitionDown,
    defaultTransitionUp,
    handleNavigation,
    navigableForwardFocus,
  } from './utils/handleNavigation.js';
  import { scrollColumn } from './utils/withScrolling.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  let props: ColumnProps & { children?: any } = $props();
  let view: LightningComponent | undefined;

  const columnStyles: NodeStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: 30,
  };

  export function getElement() {
    return view?.element;
  }

  export function setFocus() {
    getElement()?.setFocus();
  }

  export function scrollToIndex(
    index: number,
    options: { noFocus?: boolean } | undefined = undefined,
  ) {
    const element = getElement();
    if (!element) return;
    element.selected = index;
    scrollColumn(index, element);
    if (!options?.noFocus) {
      element.children[index]?.setFocus();
    }
  }

  const onUp = handleNavigation('up');
  const onDown = handleNavigation('down');

  const nodeProps = $derived.by(() => {
    const { children, ...rest } = props;
    return rest;
  });
</script>

<View
  bind:this={view}
  {...nodeProps}
  selected={props.selected || 0}
  transitionUp={defaultTransitionUp}
  transitionDown={defaultTransitionDown}
  onUp={chainFunctions(onUp, props.onUp)}
  onDown={chainFunctions(onDown, props.onDown)}
  forwardFocus={navigableForwardFocus}
  {scrollToIndex}
  onLayout={props.selected
    ? chainFunctions(props.onLayout, scrollColumn)
    : props.onLayout}
  onSelectedChanged={chainFunctions(
    props.onSelectedChanged,
    props.scroll !== 'none' ? scrollColumn : undefined,
  )}
  style={combineStyles(props.style, columnStyles)}
>
  {@render props.children?.()}
</View>
