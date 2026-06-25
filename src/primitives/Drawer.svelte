<script lang="ts">
  import type { Snippet } from 'svelte';
  import View from '../View.svelte';
  import { ElementNode, type NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import { chainFunctions } from './utils/chainFunctions.js';

  type Side = 'left' | 'right' | 'top' | 'bottom';

  interface Props extends NodeProps {
    open?: boolean;
    side?: Side;
    closeOnBack?: boolean;
    overlayColor?: string | number;
    panelProps?: NodeProps;
    duration?: number;
    easing?: string;
    onClose?: () => boolean | void;
    children?: Snippet;
  }

  let props: Props = $props();
  let panel = $state<LightningComponent | undefined>();
  let visible = $state(false);
  let panelElement: ElementNode | undefined;
  let panelMeasured = false;
  let panelOpen = false;
  let closing = false;
  let openTimeout: number | undefined;
  let animationController: ReturnType<ElementNode['animate']> | undefined;
  let closeToken = 0;
  let previousOpen = false;

  const side = $derived(props.side ?? 'right');
  const width = $derived(props.w ?? 1920);
  const height = $derived(props.h ?? 1080);
  const duration = $derived(props.duration ?? 260);
  const initialPanelX = $derived.by(() => {
    if (side === 'left') return 0;
    if (side === 'right') return width;
    return props.panelProps?.x ?? 0;
  });
  const initialPanelY = $derived.by(() => {
    if (side === 'top') return 0;
    if (side === 'bottom') return height;
    return props.panelProps?.y ?? 0;
  });
  const panelMountX = $derived.by(() => {
    if (side === 'right') return 1;
    return props.panelProps?.mountX;
  });
  const panelMountY = $derived.by(() => {
    if (side === 'bottom') return 1;
    return props.panelProps?.mountY;
  });

  function requestClose() {
    return props.onClose?.() !== false;
  }

  function onCloseKey(
    this: ElementNode,
    e: KeyboardEvent,
    mappedEvent: string | undefined,
    handlerElm: ElementNode,
    currentFocusedElm: ElementNode,
  ) {
    if (props.closeOnBack === false) return false;
    if (mappedEvent !== 'Back' && mappedEvent !== 'Escape') return false;
    return requestClose();
  }

  function hasPanelSize(target: ElementNode) {
    return side === 'left' || side === 'right'
      ? target.width > 0
      : target.height > 0;
  }

  function measureContent(target: ElementNode) {
    let maxRight = target.width;
    let maxBottom = target.height;

    function walk(node: ElementNode, offsetX: number, offsetY: number) {
      for (const child of node.children) {
        if (!(child instanceof ElementNode)) continue;
        const childX = offsetX + (child.x || 0);
        const childY = offsetY + (child.y || 0);
        maxRight = Math.max(maxRight, childX + child.width);
        maxBottom = Math.max(maxBottom, childY + child.height);
        walk(child, childX, childY);
      }
    }

    walk(target, 0, 0);
    return { width: maxRight, height: maxBottom };
  }

  function fitPanelToContent(target: ElementNode) {
    const content = measureContent(target);
    if (content.width > target.width) {
      target.width = content.width;
    }
    if (content.height > target.height) {
      target.height = content.height;
    }
  }

  function closedPosition(target: ElementNode) {
    if (side === 'left') return { x: -(target.width || width) };
    if (side === 'right') return { x: width + (target.width || 0) };
    if (side === 'top') return { y: -(target.height || height) };
    return { y: height + (target.height || 0) };
  }

  function openPosition(target: ElementNode) {
    if (side === 'left') return { x: 0 };
    if (side === 'right') return { x: width };
    if (side === 'top') return { y: 0 };
    return { y: height };
  }

  function animatePanel(
    target: ElementNode,
    to: { x?: number; y?: number },
    token: number,
    onStopped?: () => void,
  ) {
    (
      animationController as
        | { stop: (reset?: boolean) => void }
        | undefined
    )?.stop(false);
    animationController = target
      .animate(to, { duration, easing: props.easing ?? 'ease-in-out' })
      .start();
    animationController.waitUntilStopped().then(() => {
      if (token === closeToken) {
        onStopped?.();
      }
    });
  }

  function openPanel(target: ElementNode, token: number) {
    if (!props.open || token !== closeToken || panelMeasured) return;
    if (!hasPanelSize(target)) return;
    panelMeasured = true;
    fitPanelToContent(target);
    Object.assign(target, closedPosition(target));
    openTimeout = window.setTimeout(() => {
      target.updateLayout();
      fitPanelToContent(target);
      Object.assign(target, closedPosition(target));
      if (props.open && token === closeToken) {
        animatePanel(target, openPosition(target), token, () => {
          panelOpen = true;
        });
      }
    }, 0);
  }

  function alignOpenPanel(target: ElementNode) {
    if (!props.open || !panelOpen || !hasPanelSize(target)) return;
    fitPanelToContent(target);
    Object.assign(target, openPosition(target));
  }

  function onPanelLayout(this: ElementNode, target: ElementNode) {
    panelElement = target;
    const result = props.panelProps?.onLayout?.call(this, target);
    if (!closing) {
      openPanel(target, closeToken);
      alignOpenPanel(target);
    }
    return result;
  }

  export function getElement() {
    return panel?.element;
  }

  export function setFocus() {
    getElement()?.setFocus();
  }

  const rootProps = $derived.by(() => {
    const {
      children,
      open,
      side,
      closeOnBack,
      overlayColor,
      panelProps,
      duration,
      easing,
      onClose,
      onKeyPress,
      w,
      h,
      color,
      autofocus,
      forwardFocus,
      ...rest
    } = props;
    return rest;
  });

  const panelNodeProps = $derived.by(() => {
    const {
      x,
      y,
      w,
      h,
      transition,
      animationSettings,
      onLayout,
      forwardFocus,
      display,
      flexDirection,
      minHeight,
      padding,
      gap,
      ...rest
    } = props.panelProps ?? {};
    return rest;
  });

  $effect(() => {
    const open = props.open === true;
    if (open === previousOpen) return;
    previousOpen = open;

    if (open) {
      const token = ++closeToken;
      visible = true;
      closing = false;
      panelMeasured = false;
      panelOpen = false;
      if (openTimeout !== undefined) {
        window.clearTimeout(openTimeout);
        openTimeout = undefined;
      }
      return;
    }

    if (!visible) return;
    const token = ++closeToken;
    closing = true;
    panelMeasured = false;
    panelOpen = false;
    if (openTimeout !== undefined) {
      window.clearTimeout(openTimeout);
      openTimeout = undefined;
    }
    const target = panelElement;
    if (!target) {
      visible = false;
      closing = false;
      return;
    }
    animatePanel(target, closedPosition(target), token, () => {
      if (!props.open) {
        visible = false;
        closing = false;
        panelElement = undefined;
      }
    });
  });
</script>

{#if visible}
  <View
    {...rootProps}
    w={width}
    h={height}
    color={props.overlayColor ?? props.color}
    autofocus={props.autofocus ?? true}
    forwardFocus={0}
    onKeyPress={chainFunctions(props.onKeyPress, onCloseKey)}
  >
    <View
      bind:this={panel}
      {...panelNodeProps}
      x={initialPanelX}
      y={initialPanelY}
      mountX={panelMountX}
      mountY={panelMountY}
      display={props.panelProps?.display ?? 'flex'}
      flexDirection={props.panelProps?.flexDirection ?? 'column'}
      minHeight={props.panelProps?.minHeight ?? height}
      padding={props.panelProps?.padding}
      gap={props.panelProps?.gap}
      onLayout={onPanelLayout}
      forwardFocus={props.panelProps?.forwardFocus ?? 0}
    >
      {@render props.children?.()}
    </View>
  </View>
{/if}
