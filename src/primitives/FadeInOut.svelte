<script lang="ts">
  import View from '../View.svelte';
  import type { ElementNode, NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  interface Props extends Omit<NodeProps, 'transition'> {
    fadeTransition?: {
      duration?: number;
      easing?: string;
    };
    when?: boolean;
    children?: any;
  }

  let props: Props = $props();
  let view = $state<LightningComponent | undefined>();
  let visible = $state(false);
  let exitToken = 0;
  let fadeController: ReturnType<ElementNode['animate']> | undefined;
  let previousWhen: boolean | undefined;
  const duration = $derived(props.fadeTransition?.duration ?? 250);
  const easing = $derived(props.fadeTransition?.easing ?? 'ease-in-out');

  function onCreate(elm: ElementNode) {
    elm.alpha = 0;
    fadeIn(elm);
    if (typeof props.onCreate === 'function') {
      props.onCreate.call(elm, elm);
    }
  }

  function onDestroy(elm: ElementNode) {
    (
      fadeController as { stop: (reset?: boolean) => void } | undefined
    )?.stop(false);
    if (typeof props.onDestroy === 'function') {
      return props.onDestroy.call(elm, elm);
    }
  }

  function fadeIn(elm: ElementNode) {
    (
      fadeController as { stop: (reset?: boolean) => void } | undefined
    )?.stop(false);
    fadeController = elm.animate({ alpha: 1 }, { duration, easing }).start();
  }

  function fadeOut(elm: ElementNode, token: number) {
    (
      fadeController as { stop: (reset?: boolean) => void } | undefined
    )?.stop(false);
    fadeController = elm.animate({ alpha: 0 }, { duration, easing }).start();
    fadeController.waitUntilStopped().then(() => {
      if (token === exitToken && props.when === false) {
        visible = false;
      }
    });
  }

  export const ALPHA_NONE = { alpha: 0 };
  export const ALPHA_FULL = { alpha: 1 };

  export function getElement() {
    return view?.getElement?.() ?? view?.element;
  }

  export function setFocus() {
    getElement()?.setFocus();
  }

  const nodeProps = $derived.by(() => {
    const { children, when, fadeTransition, ...rest } = props;
    return rest;
  });

  $effect(() => {
    const when = props.when !== false;
    if (when === previousWhen) return;
    previousWhen = when;

    if (when) {
      exitToken++;
      const elm = view?.getElement?.() ?? view?.element;
      if (elm) {
        fadeIn(elm);
      }
      visible = true;
      return;
    }

    if (!visible) return;

    const elm = view?.getElement?.() ?? view?.element;
    if (!elm) {
      visible = false;
      return;
    }

    fadeOut(elm, ++exitToken);
  });
</script>

{#if visible}
  <View bind:this={view} {...nodeProps} {onCreate} {onDestroy}>
    {@render props.children?.()}
  </View>
{/if}
