<script lang="ts">
  import View from '../View.svelte';
  import { combineStyles, type ElementNode, type NodeStyles } from '../index.js';
  import type { RowProps } from './types.js';
  import { chainFunctions } from './utils/chainFunctions.js';
  import {
    defaultTransitionBack,
    defaultTransitionForward,
    handleNavigation,
    navigableForwardFocus,
  } from './utils/handleNavigation.js';
  import { scrollRow } from './utils/withScrolling.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  let props: RowProps & { children?: any } = $props();
  let view: LightningComponent | undefined;

  const rowStyles: NodeStyles = {
    display: 'flex',
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
    scrollRow(index, element);
    if (!options?.noFocus) {
      element.children[index]?.setFocus();
    }
  }

  const onLeft = handleNavigation('left');
  const onRight = handleNavigation('right');

  const nodeProps = $derived.by(() => {
    const { children, ...rest } = props;
    return rest;
  });
</script>

<View
  bind:this={view}
  {...nodeProps}
  selected={props.selected || 0}
  transitionLeft={defaultTransitionBack}
  transitionRight={defaultTransitionForward}
  onLeft={chainFunctions(onLeft, props.onLeft)}
  onRight={chainFunctions(onRight, props.onRight)}
  forwardFocus={navigableForwardFocus}
  {scrollToIndex}
  onLayout={props.selected
    ? chainFunctions(props.onLayout, scrollRow)
    : props.onLayout}
  onSelectedChanged={chainFunctions(
    props.onSelectedChanged,
    props.scroll !== 'none' ? scrollRow : undefined,
  )}
  style={combineStyles(props.style, rowStyles)}
>
  {@render props.children?.()}
</View>
