<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy, onMount } from 'svelte';
  import View from '../View.svelte';
  import type { NodeProps } from '../core/index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import { chainFunctions } from './utils/chainFunctions.js';
  import { getFocusFeedContext } from './focusFeedContext.js';

  interface Props extends NodeProps {
    id: string;
    focusTarget?: LightningComponent;
    children?: Snippet;
  }

  let props: Props = $props();
  let item: LightningComponent | undefined;
  const feed = getFocusFeedContext();
  let unregister: (() => void) | undefined;

  function getElement() {
    return item?.element;
  }

  function setFocus() {
    const target = props.focusTarget;
    if (target) {
      target.setFocus();
      return true;
    }

    item?.setFocus();
    return true;
  }

  function handleFocus(
    currentFocusedElm: Parameters<NonNullable<NodeProps['onFocus']>>[0],
    prevFocusedElm: Parameters<NonNullable<NodeProps['onFocus']>>[1],
    nodeWithCallback: Parameters<NonNullable<NodeProps['onFocus']>>[2],
  ) {
    const element = item?.element;
    feed?.setCurrentId(props.id);
    if (element) {
      props.onFocus?.call(
        element,
        currentFocusedElm,
        prevFocusedElm,
        nodeWithCallback,
      );
    }
  }

  function focusPrevious() {
    return feed?.focusPrevious(props.id);
  }

  function focusNext() {
    return feed?.focusNext(props.id);
  }

  export { getElement, setFocus };

  onMount(() => {
    unregister = feed?.register({
      id: props.id,
      getElement,
      setFocus,
    });
  });

  onDestroy(() => {
    unregister?.();
  });

  const nodeProps = $derived.by(() => {
    const { children, id, focusTarget, onFocus, onUp, onDown, ...rest } = props;
    return rest;
  });
</script>

<View
  bind:this={item}
  {...nodeProps}
  forwardFocus={props.forwardFocus ?? 0}
  onUp={chainFunctions(props.onUp, focusPrevious)}
  onDown={chainFunctions(props.onDown, focusNext)}
  onFocus={handleFocus}
>
  {@render props.children?.()}
</View>
