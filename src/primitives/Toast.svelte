<script lang="ts">
  import type { Snippet } from 'svelte';
  import { type NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import FadeInOut from './FadeInOut.svelte';

  interface Props extends NodeProps {
    open?: boolean;
    duration?: number;
    onClose?: () => void;
    children?: Snippet;
  }

  let props: Props = $props();
  let view: LightningComponent | undefined;

  export function getElement() {
    return view?.element;
  }

  export function setFocus() {
    getElement()?.setFocus();
  }

  const nodeProps = $derived.by(() => {
    const {
      children,
      open,
      duration,
      onClose,
      display,
      flexDirection,
      gap,
      ...rest
    } = props;
    return rest;
  });

  $effect(() => {
    if (!props.open || !props.duration) return;
    const timeout = window.setTimeout(() => {
      props.onClose?.();
    }, props.duration);
    return () => window.clearTimeout(timeout);
  });
</script>

<FadeInOut
  bind:this={view}
  when={props.open === true}
  {...nodeProps}
  display={props.display ?? 'flex'}
  flexDirection={props.flexDirection ?? 'column'}
  gap={props.gap}
>
  {@render props.children?.()}
</FadeInOut>
