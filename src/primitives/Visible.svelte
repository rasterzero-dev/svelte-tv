<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props<T> {
    when: T | undefined | null | false;
    children?: Snippet;
  }

  let props: Props<unknown> = $props();
</script>

{#if props.when}
  {@render props.children?.()}
{/if}
