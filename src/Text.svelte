<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    applyNodeProps,
    createNode,
    getParentNode,
    mountNode,
    setParentNode,
    setTextContent,
    unmountNode,
    type SvelteTextProps,
  } from './core/svelteNode.js';

  let props: SvelteTextProps = $props();
  const node = createNode('text', {});
  const parent = getParentNode();
  setParentNode(node);
  export { node as element };

  export function setFocus() {
    node.setFocus();
  }

  $effect(() => {
    applyNodeProps(node, props);
    setTextContent(node, props.text as string | undefined);
  });

  onMount(() => mountNode(node, parent));
  onDestroy(() => unmountNode(node));
</script>

{@render props.children?.()}
