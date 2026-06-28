<script lang="ts">
  import { onDestroy } from 'svelte';
  import View from '../View.svelte';
  import { renderer, type NodeProps } from '../index.js';

  interface Props extends NodeProps {
    src: string;
    placeholder?: string;
    fallback?: string;
    children?: any;
  }

  let props: Props = $props();
  let texture = $state<any>(null);
  let currentSrc = $state<string | null>(null);
  let cancelled = false;

  $effect(() => {
    cancelled = false;
    currentSrc = props.placeholder || props.src;

    const srcTexture = renderer.createTexture('ImageTexture', props);

    if (props.fallback) {
      srcTexture.once('failed', () => {
        if (!cancelled && props.fallback !== props.placeholder) {
          currentSrc = props.fallback!;
        }
      });
    }

    srcTexture
      .getTextureData()
      .then((resp: any) => {
        if (!cancelled && resp.data) {
          texture = srcTexture;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  });

  onDestroy(() => {
    cancelled = true;
  });

  const nodeProps = $derived.by(() => {
    const { children, placeholder, fallback, ...rest } = props;
    return rest;
  });
</script>

<View
  {...nodeProps}
  src={currentSrc}
  color={props.color || 0xffffffff}
  {texture}
>
  {@render props.children?.()}
</View>
