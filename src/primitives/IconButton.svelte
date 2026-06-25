<script lang="ts">
  import type { Snippet } from 'svelte';
  import { type ElementNode, type NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import { chainFunctions } from './utils/chainFunctions.js';
  import Button from './Button.svelte';

  type RevealPlacement = 'left' | 'right' | 'top' | 'bottom' | 'none';

  interface Props extends NodeProps {
    disabled?: boolean;
    revealPlacement?: RevealPlacement;
    icon?: Snippet;
    children?: Snippet;
  }

  let props: Props = $props();
  let button: LightningComponent | undefined;
  let focused = $state(false);

  export function getElement() {
    return button?.getElement?.() ?? button?.element;
  }

  export function setFocus() {
    button?.setFocus();
  }

  function setFocused(
    this: ElementNode,
    currentFocusedElm: ElementNode,
    prevFocusedElm: ElementNode | undefined,
    nodeWithCallback: ElementNode,
  ) {
    focused = true;
  }

  function setBlurred(
    this: ElementNode,
    currentFocusedElm: ElementNode,
    prevFocusedElm: ElementNode,
    nodeWithCallback: ElementNode,
  ) {
    focused = false;
  }

  const nodeProps = $derived.by(() => {
    const {
      children,
      icon,
      revealPlacement,
      disabled,
      display,
      flexDirection,
      alignItems,
      justifyContent,
      padding,
      gap,
      onFocus,
      onBlur,
      ...rest
    } = props;
    return rest;
  });

  const flexDirection = $derived.by(() => {
    if (props.revealPlacement === 'top' || props.revealPlacement === 'bottom') {
      return 'column';
    }
    return 'row';
  });

  const showContent = $derived(
    focused &&
      props.revealPlacement !== undefined &&
      props.revealPlacement !== 'none' &&
      props.children,
  );
</script>

<Button
  bind:this={button}
  {...nodeProps}
  disabled={props.disabled}
  display={props.display ?? 'flex'}
  flexDirection={props.flexDirection ?? flexDirection}
  alignItems={props.alignItems ?? 'center'}
  justifyContent={props.justifyContent ?? 'center'}
  padding={props.padding}
  gap={props.gap ?? 4}
  onFocus={chainFunctions(props.onFocus, setFocused)}
  onBlur={chainFunctions(props.onBlur, setBlurred)}
>
  {#if showContent && (props.revealPlacement === 'left' || props.revealPlacement === 'top')}
    {@render props.children?.()}
  {/if}
  {@render props.icon?.()}
  {#if showContent && (props.revealPlacement === 'right' || props.revealPlacement === 'bottom')}
    {@render props.children?.()}
  {/if}
</Button>
