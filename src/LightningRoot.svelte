<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type {
    RendererMain,
    RendererMainSettings,
  } from '@lightningjs/renderer';
  import type { Snippet } from 'svelte';
  import {
    createFocusManager,
    type KeyHoldOptions,
    type KeyMap,
  } from './core/focusManager.js';
  import { createRenderer, rootNode } from './core/root.js';
  import { setParentNode } from './core/svelteNode.js';

  interface Props {
    options?: Partial<RendererMainSettings>;
    target?: HTMLElement | string;
    keyMap?: Partial<KeyMap>;
    keyHoldOptions?: KeyHoldOptions;
    useFocusManager?: boolean;
    onReady?: (renderer: RendererMain) => void | Promise<void>;
    children?: Snippet;
  }

  let {
    options,
    target = 'app',
    keyMap,
    keyHoldOptions,
    useFocusManager = true,
    onReady,
    children,
  }: Props = $props();

  setParentNode(rootNode);

  let cleanupFocus: (() => void) | undefined;
  let ready = $state(false);
  let destroyed = false;

  onMount(() => {
    const { renderer } = createRenderer(options, target);
    cleanupFocus = useFocusManager
      ? createFocusManager(keyMap, keyHoldOptions)
      : undefined;
    Promise.resolve(onReady?.(renderer)).then(() => {
      if (!destroyed) ready = true;
    });
  });

  onDestroy(() => {
    destroyed = true;
    cleanupFocus?.();
  });
</script>

{#if ready}
  {@render children?.()}
{/if}
