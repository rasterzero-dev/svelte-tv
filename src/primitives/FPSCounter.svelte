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
  let criticalThreshold = $state('');
  let targetThreshold = $state('');
  let renderableMemUsed = $state('');
  let memUsed = $state('');
  let renderableTexturesLoaded = $state(0);
  let loadedTextures = $state(0);
  let count = 0;
  let total = 0;
  let frameCount = 0;
  let elapsed = 0;
  let memoryUpdateCount = 0;

  const fpsStyle = {
    color: 0x000000ff,
    h: 216,
    w: 330,
    x: 1900,
    y: 6,
    mountX: 1,
    alpha: 1,
    zIndex: 100,
  };

  function bytesToMb(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(2)} Mb`;
  }

  function getDraws() {
    const renderer = getRenderer();
    const renderOps = (
      renderer?.stage.renderer as { renderOps?: unknown[] } | undefined
    )?.renderOps;
    return Array.isArray(renderOps) ? renderOps.length : 0;
  }

  function updateMemoryInfo() {
    const memInfo = getRenderer()?.stage.txMemManager.getMemoryInfo();
    if (!memInfo) return;

    criticalThreshold = bytesToMb(memInfo.criticalThreshold);
    targetThreshold = bytesToMb(memInfo.targetThreshold);
    renderableMemUsed = bytesToMb(memInfo.renderableMemUsed);
    memUsed = bytesToMb(memInfo.memUsed);
    renderableTexturesLoaded = memInfo.renderableTexturesLoaded;
    loadedTextures = memInfo.loadedTextures;
  }

  function updateMemoryInfoEveryTenUpdates() {
    if (memoryUpdateCount % 10 === 0) updateMemoryInfo();
    memoryUpdateCount += 1;
  }

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
    updateMemoryInfoEveryTenUpdates();
  }

  function onFrameTick(_target: any, data: { delta: number }) {
    draws = getDraws();

    frameCount += 1;
    elapsed += data.delta;
    if (elapsed < 1000) return;

    updateFps(Math.round((frameCount * 1000) / elapsed));
    updateMemoryInfoEveryTenUpdates();
    frameCount = 0;
    elapsed = 0;
  }

  function onQuadsUpdate(_target: any, data: { quads: number }) {
    quads = data.quads;
    draws = getDraws();
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
  <Text
    x={10}
    y={90}
    text={`criticalThreshold: ${criticalThreshold}`}
    fontSize={14}
    color="#f6f6f6ff"
  />
  <Text
    x={10}
    y={108}
    text={`targetThreshold: ${targetThreshold}`}
    fontSize={14}
    color="#f6f6f6ff"
  />
  <Text
    x={10}
    y={126}
    text={`renderableMemUsed: ${renderableMemUsed}`}
    fontSize={14}
    color="#f6f6f6ff"
  />
  <Text
    x={10}
    y={144}
    text={`memUsed: ${memUsed}`}
    fontSize={14}
    color="#f6f6f6ff"
  />
  <Text
    x={10}
    y={162}
    text={`Textures In Memory: ${loadedTextures}`}
    fontSize={14}
    color="#f6f6f6ff"
  />
  <Text
    x={10}
    y={180}
    text={`Textures On Screen: ${renderableTexturesLoaded}`}
    fontSize={14}
    color="#f6f6f6ff"
  />
</View>
