<script lang="ts">
  import type { Snippet } from 'svelte';
  import View from '../View.svelte';
  import { type ElementNode, type NodeProps } from '../index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import FadeInOut from './FadeInOut.svelte';
  import { chainFunctions } from './utils/chainFunctions.js';

  interface Props extends NodeProps {
    open?: boolean;
    closeOnBack?: boolean;
    overlayColor?: string | number;
    panelProps?: NodeProps;
    onClose?: () => boolean | void;
    children?: Snippet;
  }

  let props: Props = $props();
  let panel: LightningComponent | undefined;

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
      closeOnBack,
      overlayColor,
      panelProps,
      onClose,
      onKeyPress,
      w,
      h,
      color,
      autofocus,
      forwardFocus,
      display,
      alignItems,
      justifyContent,
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
      forwardFocus,
      display,
      flexDirection,
      padding,
      gap,
      ...rest
    } = props.panelProps ?? {};
    return rest;
  });
</script>

<FadeInOut
  when={props.open === true}
  {...rootProps}
  w={props.w ?? 1920}
  h={props.h ?? 1080}
  color={props.overlayColor ?? props.color}
  display={props.display ?? 'flex'}
  alignItems={props.alignItems ?? 'center'}
  justifyContent={props.justifyContent ?? 'center'}
  autofocus={props.autofocus ?? true}
  forwardFocus={0}
  onKeyPress={chainFunctions(props.onKeyPress, onCloseKey)}
>
  <View
    bind:this={panel}
    {...panelNodeProps}
    display={props.panelProps?.display ?? 'flex'}
    flexDirection={props.panelProps?.flexDirection ?? 'column'}
    gap={props.panelProps?.gap ?? 16}
    forwardFocus={props.panelProps?.forwardFocus ?? 0}
    padding={props.panelProps?.padding ?? 36}
  >
    {@render props.children?.()}
  </View>
</FadeInOut>
