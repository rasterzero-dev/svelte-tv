<script lang="ts">
  import View from '../View.svelte';
  import Text from '../Text.svelte';
  import type { ElementNode, NodeProps, TextProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';

  interface Props extends NodeProps {
    marquee: boolean;
    text: string;
    textProps?: TextProps;
    delay?: number;
    speed?: number;
    scrollGap?: number;
    easing?: string;
  }

  let props: Props = $props();
  let textNode: LightningComponent | undefined;
  let repeatNode = $state<LightningComponent>();
  let textRef = $derived(textNode?.element);
  let repeatRef = $derived(repeatNode?.element);
  let frame = 0;
  let repeatX = $state(0);

  $effect(() => {
    cancelAnimationFrame(frame);

    if (!props.marquee || !textRef) return;

    function start() {
      if (!textRef || !repeatRef) return;
      if (!textRef.rendered || !repeatRef.rendered) {
        frame = requestAnimationFrame(start);
        return;
      }

      const width = textRef.width || 0;
      const containerWidth =
        (typeof props.width === 'number' ? props.width : props.w) || 0;
      const gap = props.scrollGap ?? containerWidth * 0.5;
      if (!width || width <= containerWidth) {
        textRef.x = 0;
        frame = requestAnimationFrame(start);
        return;
      }

      const distance = width + gap;
      repeatX = distance;
      textRef.x = 0;
      repeatRef.x = distance;

      const startedAt = performance.now() + (props.delay ?? 1000);
      function tick(now: number) {
        if (!textRef || !repeatRef) return;

        const elapsed = Math.max(0, now - startedAt);
        const offset = ((elapsed * (props.speed || 200)) / 1000) % distance;
        textRef.x = -offset;
        repeatRef.x = distance - offset;
        frame = requestAnimationFrame(tick);
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(start);
    return () => {
      cancelAnimationFrame(frame);
    };
  });

  const nodeProps = $derived.by(() => {
    const {
      marquee,
      text,
      textProps,
      delay,
      speed,
      scrollGap,
      easing,
      children,
      ...rest
    } = props;
    return rest;
  });

  const textNodeProps = $derived.by(() => {
    const { children, ...rest } = props.textProps || {};
    return rest;
  });
</script>

<View {...nodeProps} clipping={props.marquee}>
  <Text {...textNodeProps} bind:this={textNode} text={props.text} />
  {#if props.marquee}
    <Text
      {...textNodeProps}
      bind:this={repeatNode}
      x={repeatX}
      text={props.text}
    />
  {/if}
</View>
