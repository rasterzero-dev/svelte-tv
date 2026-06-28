<script lang="ts">
  import type {
    IconifyIcon,
    IconifyIconOnLoad,
    IconifyIconProps,
  } from '@iconify/svelte/dist/functions';
  import {
    addIcon,
    generateIcon,
    getIcon,
    loadIcon,
  } from '@iconify/svelte/dist/functions';
  import { renderer, type NodeProps } from '../index.js';
  import View from '../View.svelte';

  type Props = Omit<NodeProps, 'color' | 'height' | 'width'> &
    IconifyIconProps & {
      onLoad?: IconifyIconOnLoad;
      onload?: IconifyIconOnLoad;
    };

  let props: Props = $props();
  let texture = $state<any>();
  let viewWidth = $state<number | undefined>();
  let viewHeight = $state<number | undefined>();
  let loadId = 0;
  const storagePrefix = 'svelte-tv:iconify:v1:';

  function numberSize(size: unknown) {
    if (typeof size === 'number') return size;
    if (typeof size !== 'string') return undefined;

    const match = size.match(/^(\d+(?:\.\d+)?)(px)?$/);
    return match ? Number(match[1]) : undefined;
  }

  function base64Encode(value: string) {
    const encoded = encodeURIComponent(value);
    let binary = '';

    for (let i = 0; i < encoded.length; i++) {
      if (encoded[i] === '%') {
        binary += String.fromCharCode(
          parseInt(encoded.slice(i + 1, i + 3), 16),
        );
        i += 2;
      } else {
        binary += encoded[i];
      }
    }

    return btoa(binary);
  }

  function createSvg(icon: IconifyIcon) {
    const data = generateIcon(icon, { ...props, mode: 'svg' });

    if (!data?.svg) return undefined;

    const width = numberSize(data.attributes.width) ?? icon.width ?? 16;
    const height = numberSize(data.attributes.height) ?? icon.height ?? 16;

    const attributes = Object.entries(data.attributes)
      .map(
        ([key, value]) => `${key}="${String(value).replace(/"/g, '&quot;')}"`,
      )
      .join(' ');

    viewWidth = typeof props.w === 'number' ? props.w : width;
    viewHeight = typeof props.h === 'number' ? props.h : height;

    return `<svg ${attributes}>${data.body}</svg>`;
  }

  function createTexture(icon: IconifyIcon) {
    const svg = createSvg(icon);

    if (!svg) return undefined;

    return renderer.createTexture('ImageTexture', {
      src: `data:image/svg+xml;base64,${base64Encode(svg)}`,
      type: 'svg',
      w: viewWidth,
      h: viewHeight,
    });
  }

  function readStoredIcon(name: string) {
    if (typeof localStorage === 'undefined') return undefined;

    try {
      const raw = localStorage.getItem(storagePrefix + name);
      if (!raw) return undefined;

      const icon = JSON.parse(raw) as IconifyIcon;
      if (icon && typeof icon.body === 'string') {
        addIcon(name, icon);
        return getIcon(name) ?? icon;
      }
    } catch {}
  }

  function storeIcon(name: string, icon: IconifyIcon) {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(storagePrefix + name, JSON.stringify(icon));
    } catch {}
  }

  $effect(() => {
    const currentLoadId = ++loadId;
    texture = undefined;

    if (typeof props.icon !== 'string') {
      texture = createTexture(props.icon);
      return;
    }

    const cachedIcon = getIcon(props.icon);
    const storedIcon =
      cachedIcon === undefined ? readStoredIcon(props.icon) : cachedIcon;

    if (storedIcon) {
      texture = createTexture(storedIcon);
      props.onLoad?.(props.icon);
      props.onload?.(props.icon);
      return;
    }

    if (storedIcon === null) return;

    loadIcon(props.icon)
      .then((icon) => {
        if (currentLoadId !== loadId) return;
        storeIcon(props.icon as string, icon);
        texture = createTexture(icon);
        props.onLoad?.(props.icon as string);
        props.onload?.(props.icon as string);
      })
      .catch(() => {});
  });

  const nodeProps = $derived.by(() => {
    const {
      icon,
      mode,
      color,
      flip,
      hFlip,
      vFlip,
      rotate,
      inline,
      width,
      height,
      id,
      onLoad,
      onload,
      ...rest
    } = props;
    return rest;
  });
</script>

{#if texture}
  <View
    {...nodeProps}
    {texture}
    w={viewWidth}
    h={viewHeight}
    color={0xffffffff}
  />
{/if}
