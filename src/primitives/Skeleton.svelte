<script lang="ts">
  import View from '../View.svelte';
  import { type NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  type Variant = 'rect' | 'text' | 'circle';

  interface Props extends NodeProps {
    rows?: number;
    rowGap?: number;
    variant?: Variant;
  }

  let props: Props = $props();
  let view: LightningComponent | undefined;

  const rows = $derived(Math.max(1, props.rows ?? 1));
  const rowGap = $derived(props.rowGap ?? 10);
  const width = $derived(props.w ?? 180);
  const height = $derived(props.h ?? (props.variant === 'text' ? 18 : 80));
  const rowHeight = $derived(
    props.variant === 'text'
      ? height
      : Math.max(1, Math.floor((height - rowGap * (rows - 1)) / rows)),
  );

  export function getElement() {
    return view?.element;
  }

  export function setFocus() {
    getElement()?.setFocus();
  }

  const nodeProps = $derived.by(() => {
    const {
      rows,
      rowGap,
      variant,
      color,
      alpha,
      borderRadius,
      display,
      flexDirection,
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
  gap={props.gap ?? rowGap}
>
  {#if props.variant === 'circle'}
    <View
      w={Math.min(width, height)}
      h={Math.min(width, height)}
      color={props.color}
      alpha={props.alpha}
      borderRadius={props.borderRadius ?? Math.min(width, height) / 2}
    />
  {:else}
    {#each Array(rows) as _, index}
      <View
        w={index === rows - 1 && rows > 1 ? width * 0.72 : width}
        h={rowHeight}
        color={props.color}
        alpha={props.alpha}
        borderRadius={props.borderRadius}
      />
    {/each}
  {/if}
</View>
