<script lang="ts">
  import View from '../View.svelte';
  import type { ElementNode, NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  let props: NodeProps & { children?: any } = $props();
  let view: LightningComponent | undefined;

  export function getElement() {
    return view?.element;
  }

  export function setFocus() {
    getElement()?.setFocus();
  }

  function onRender(el: ElementNode) {
    el.hidden = false;
    props.onRender?.call(el, el);
  }

  function onRemove(el: ElementNode) {
    el.hidden = true;
    props.onRemove?.call(el, el);
  }

  const nodeProps = $derived.by(() => {
    const { children, ...rest } = props;
    return rest;
  });
</script>

<View bind:this={view} {...nodeProps} preserve {onRender} {onRemove}>
  {@render props.children?.()}
</View>
