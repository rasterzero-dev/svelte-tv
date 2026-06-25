<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import View from '../View.svelte';
  import Text from '../Text.svelte';
  import { getRenderer, type NodeProps } from '../index.js';

  let props: NodeProps & { children?: any } = $props();

  let fps = $state(0);
  let avgFps = $state(0);
  let minFps = $state(99);
  let maxFps = $state(0);
  let quads = $state(0);
  let draws = $state(0);
  let count = 0;
  let total = 0;
  let frameCount = 0;
  let elapsed = 0;

  const fpsStyle = {
    color: 0x000000ff,
    h: 112,
    w: 330,
    x: 1900,
    y: 6,
    mountX: 1,
    alpha: 1,
    zIndex: 100,
  };

  function updateFps(value: number) {
    if (value <= 5) return;
    fps = value;
    minFps = Math.min(minFps, value);
    maxFps = Math.max(maxFps, value);
    total += value;
    count += 1;
    avgFps = Math.round(total / count);
  }

  function onFps(_target: any, fpsData: any) {
    updateFps(typeof fpsData === 'number' ? fpsData : fpsData.fps);
  }

  function onFrameTick(_target: any, data: { delta: number }) {
    const renderer = getRenderer();
    const renderOps = (
      renderer?.stage.renderer as { renderOps?: unknown[] } | undefined
    )?.renderOps;
    draws = Array.isArray(renderOps) ? renderOps.length : 0;

    frameCount += 1;
    elapsed += data.delta;
    if (elapsed < 1000) return;

    updateFps(Math.round((frameCount * 1000) / elapsed));
    frameCount = 0;
    elapsed = 0;
  }

  function onQuadsUpdate(_target: any, data: { quads: number }) {
    quads = data.quads;
  }

  onMount(() => {
    const renderer = getRenderer();
    if (!renderer) return;
    renderer.on('frameTick', onFrameTick);
    renderer.on('fpsUpdate', onFps);
    renderer.on('quadsUpdate', onQuadsUpdate);
    return () => {
      renderer.off?.('frameTick', onFrameTick);
      renderer.off?.('fpsUpdate', onFps);
      renderer.off?.('quadsUpdate', onQuadsUpdate);
    };
  });

  onDestroy(() => {
    const renderer = getRenderer();
    renderer?.off?.('frameTick', onFrameTick);
    renderer?.off?.('fpsUpdate', onFps);
    renderer?.off?.('quadsUpdate', onQuadsUpdate);
  });
</script>

<View {...fpsStyle} {...props}>
  <Text x={10} y={8} text={`FPS ${fps}`} fontSize={20} color="#f6f6f6ff" />
  <Text x={120} y={8} text={`AVG ${avgFps}`} fontSize={20} color="#f6f6f6ff" />
  <Text x={10} y={34} text={`MIN ${minFps}`} fontSize={18} color="#f6f6f6ff" />
  <Text x={120} y={34} text={`MAX ${maxFps}`} fontSize={18} color="#f6f6f6ff" />
  <Text x={10} y={62} text={`Quads ${quads}`} fontSize={16} color="#f6f6f6ff" />
  <Text
    x={120}
    y={62}
    text={`Draws ${draws}`}
    fontSize={16}
    color="#f6f6f6ff"
  />
</View>
