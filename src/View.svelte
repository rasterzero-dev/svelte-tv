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
        if (cancelled || gif.frames.length === 0) return;

        const renderer = getRenderer();
        if (!renderer) return;

        const createFrameTexture = (index: number) => {
          const frame = gif.frames[index]!;
          return renderer.createTexture('ImageTexture', {
            src: () =>
              new ImageData(
                frame.pixels as unknown as ImageDataArray,
                gif.width,
                gif.height,
              ),
          });
        };

        const ownedTextures = new Map<
          ReturnType<typeof createFrameTexture>,
          string
        >();
        let ownerId = 0;

        const releaseTexture = (
          texture: ReturnType<typeof createFrameTexture>,
        ) => {
          const owner = ownedTextures.get(texture);
          if (!owner) return;
          texture.setRenderableOwner(owner, false);
          ownedTextures.delete(texture);
        };

        releasePreloads = () => {
          for (const [texture, owner] of ownedTextures) {
            texture.setRenderableOwner(owner, false);
          }
          ownedTextures.clear();
        };

        const preloadFrame = (index: number) => {
          const texture = createFrameTexture(index);
          const owner = `gif:${src}:${ownerId++}`;
          ownedTextures.set(texture, owner);

          return new Promise<{ texture: typeof texture; loaded: boolean }>(
            (resolve) => {
              texture.once('loaded', () => resolve({ texture, loaded: true }));
              texture.once('failed', () => resolve({ texture, loaded: false }));
              texture.setRenderableOwner(owner, true);
            },
          );
        };

        let frameIndex = 0;
        let completedLoops = 0;
        const firstFrame = await preloadFrame(frameIndex);

        if (cancelled || !firstFrame.loaded) {
          releaseTexture(firstFrame.texture);
          return;
        }

        node.lng.src = null;
        node.color = props.color ?? 0xffffffff;
        node.texture = firstFrame.texture;
        releaseTexture(firstFrame.texture);

        const getNextFrameIndex = () => {
          if (frameIndex + 1 < gif.frames.length) {
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
            releaseTexture(loadedFrame.texture);
            return;
          }

          frameIndex = nextFrameIndex;
          node.texture = loadedFrame.texture;
          releaseTexture(loadedFrame.texture);

          nextFrameIndex = getNextFrameIndex();
          nextFrame =
            nextFrameIndex === null ? undefined : preloadFrame(nextFrameIndex);

          if (nextFrame) {
            timeout = setTimeout(
              () => advance(),
              gif.frames[frameIndex]!.duration,
            );
          }
        };

        if (nextFrame) {
          timeout = setTimeout(
            () => advance(),
            gif.frames[frameIndex]!.duration,
          );
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
