<script lang="ts" generics="T">
  import Grid from './Grid.svelte';
  import type { NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  interface Props extends NodeProps {
    each: readonly T[] | undefined | null | false;
    columns: number;
    rows?: number;
    buffer?: number;
    selected?: number;
    children: (props: {
      item: T;
      index: number;
      width: number;
      height: number;
      x: number;
      y: number;
    }) => any;
  }

  let props: Props = $props();
  let grid:
    | (LightningComponent & { scrollToIndex?: (index: number) => void })
    | undefined;

  const items = $derived(props.each || []);
  const rows = $derived(props.rows ?? 1);
  const bufferRows = $derived(props.buffer ?? 2);
  const selected = $derived(props.selected ?? 0);
  const selectedRow = $derived(Math.floor(selected / props.columns));
  const startRow = $derived(Math.max(0, selectedRow - bufferRows));
  const start = $derived(startRow * props.columns);
  const count = $derived((rows + bufferRows * 2) * props.columns);
  const slice = $derived(items.slice(start, start + count));

  export function getElement() {
    return grid?.getElement?.() ?? grid?.element;
  }

  export function setFocus() {
    grid?.setFocus();
  }

  export function scrollToIndex(index: number) {
    grid?.scrollToIndex?.(index);
  }

  const nodeProps = $derived.by(() => {
    const { each, columns, rows, buffer, selected, children, ...rest } = props;
    return rest;
  });
</script>

<Grid
  bind:this={grid}
  {...nodeProps}
  items={slice}
  columns={props.columns}
  selected={Math.max(0, selected - start)}
>
  {#snippet children(gridProps)}
    {@render props.children({
      ...gridProps,
      item: gridProps.item,
      index: start + gridProps.index,
    })}
  {/snippet}
</Grid>
