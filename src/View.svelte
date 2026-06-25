<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    applyNodeProps,
    createNode,
    getParentNode,
    mountNode,
    setParentNode,
    unmountNode,
    type SvelteNodeProps,
  } from './core/svelteNode.js';

  let props: SvelteNodeProps = $props();
  const node = createNode('view', {});
  const parent = getParentNode();
  setParentNode(node);
  export { node as element };

  export function setFocus() {
    node.setFocus();
  }

  $effect(() => {
    applyNodeProps(node, props);
  });

  onMount(() => mountNode(node, parent));
  onDestroy(() => unmountNode(node));
</script>

{@render props.children?.()}
