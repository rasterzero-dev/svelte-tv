<script lang="ts">
  import type { Snippet } from 'svelte';
  import View from '../View.svelte';
  import {
    type ElementNode,
    type KeyHandler,
    type NodeProps,
  } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  interface Props extends NodeProps {
    disabled?: boolean;
    children?: Snippet;
  }

  let props: Props = $props();
  let view: LightningComponent | undefined;

  function handleEnter(
    this: ElementNode,
    e: KeyboardEvent,
    target: ElementNode,
    handlerElm: ElementNode,
    mappedEvent?: string,
  ) {
    if (props.disabled) return true;
    return props.onEnter?.call(this, e, target, handlerElm, mappedEvent);
  }

  export function getElement() {
    return view?.element;
  }

  export function setFocus() {
    if (!props.disabled) {
      getElement()?.setFocus();
    }
  }

  const nodeProps = $derived.by(() => {
    const {
      children,
      disabled,
      onEnter,
      skipFocus,
      display,
      flexDirection,
      alignItems,
      justifyContent,
      padding,
      gap,
      ...rest
    } = props;
    return rest;
  });
</script>

<View
  bind:this={view}
  {...nodeProps}
  display={props.display ?? 'flex'}
  flexDirection={props.flexDirection ?? 'column'}
  alignItems={props.alignItems ?? 'flexStart'}
  justifyContent={props.justifyContent ?? 'center'}
  padding={props.padding ?? 20}
  gap={props.gap ?? 6}
  skipFocus={props.disabled || props.skipFocus}
  onEnter={handleEnter as KeyHandler}
>
  {@render props.children?.()}
</View>
