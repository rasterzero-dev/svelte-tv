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
  import { decodeGif, isGifSource } from './core/gif.js';
  import { getRenderer } from './core/lightningInit.js';

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

  $effect(() => {
    const src = props.src;
    if (!isGifSource(src)) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let releasePreloads = () => {};

    decodeGif(src)
      .then(async (gif) => {
        if (cancelled || gif.frameCount === 0) return;

        const renderer = getRenderer();
        if (!renderer) return;

        const preloadReleases = new Set<() => void>();
        let ownerId = 0;

        releasePreloads = () => {
          for (const release of [...preloadReleases]) {
            release();
          }
        };

        const preloadFrame = (index: number) => {
          const frame = gif.decodeFrame(index);
          let pixels: Uint8ClampedArray | undefined = frame.pixels;
          const texture = renderer.createTexture('ImageTexture', {
            src: () =>
              pixels
                ? new ImageData(
                    pixels as unknown as ImageDataArray,
                    gif.width,
                    gif.height,
                  )
                : null,
          });
          const owner = `gif:${src}:${ownerId++}`;
          let owned = true;
          const release = () => {
            if (!owned) return;
            owned = false;
            texture.setRenderableOwner(owner, false);
            preloadReleases.delete(release);
          };
          preloadReleases.add(release);

          return new Promise<{
            texture: typeof texture;
            loaded: boolean;
            duration: number;
            release: () => void;
          }>((resolve) => {
            texture.once('loaded', () => {
              pixels = undefined;
              resolve({
                texture,
                loaded: true,
                duration: frame.duration,
                release,
              });
            });
            texture.once('failed', () => {
              pixels = undefined;
              resolve({
                texture,
                loaded: false,
                duration: frame.duration,
                release,
              });
            });
            texture.setRenderableOwner(owner, true);
          });
        };

        let frameIndex = 0;
        let completedLoops = 0;
        const firstFrame = await preloadFrame(frameIndex);

        if (cancelled || !firstFrame.loaded) {
          firstFrame.release();
          return;
        }

        node.lng.src = null;
        node.color = props.color ?? 0xffffffff;
        node.texture = firstFrame.texture;
        firstFrame.release();
        let currentTexture = firstFrame.texture;

        const getNextFrameIndex = () => {
          if (frameIndex + 1 < gif.frameCount) {
            return frameIndex + 1;
          }

          if (
            gif.loopCount === null ||
            (gif.loopCount !== 0 && completedLoops >= gif.loopCount)
          ) {
            return null;
          }

          completedLoops++;
          return 0;
        };

        let nextFrameIndex = getNextFrameIndex();
        let nextFrame =
          nextFrameIndex === null ? undefined : preloadFrame(nextFrameIndex);

        const advance = async () => {
          if (cancelled || nextFrameIndex === null || !nextFrame) return;

          const loadedFrame = await nextFrame;
          if (cancelled || !loadedFrame.loaded) {
            loadedFrame.release();
            return;
          }

          frameIndex = nextFrameIndex;
          node.texture = loadedFrame.texture;
          loadedFrame.release();
          renderer.stage.txMemManager.destroyTexture(currentTexture);
          currentTexture = loadedFrame.texture;

          nextFrameIndex = getNextFrameIndex();
          nextFrame =
            nextFrameIndex === null ? undefined : preloadFrame(nextFrameIndex);

          if (nextFrame) {
            timeout = setTimeout(() => advance(), loadedFrame.duration);
          }
        };

        if (nextFrame) {
          timeout = setTimeout(() => advance(), firstFrame.duration);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      releasePreloads();
    };
  });

  onMount(() => mountNode(node, parent));
  onDestroy(() => unmountNode(node));
</script>

{@render props.children?.()}
