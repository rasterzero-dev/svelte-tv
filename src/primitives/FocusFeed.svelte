<script lang="ts">
  import type { Snippet } from 'svelte';
  import View from '../View.svelte';
  import type { AnimationSettings, NodeProps } from '../core/index.js';
  import type { LightningComponent } from '../core/svelteNode.js';
  import { chainFunctions } from './utils/chainFunctions.js';
  import { focusIntoView } from './focusIntoView.js';
  import {
    setFocusFeedContext,
    type FocusFeedItem,
  } from './focusFeedContext.js';

  interface Props extends NodeProps {
    align?: 'start' | 'center' | 'end';
    scrollTransition?: AnimationSettings;
    onLeftBoundary?: () => boolean | void;
    onRightBoundary?: () => boolean | void;
    children?: Snippet;
  }

  let props: Props = $props();
  let scroller: LightningComponent | undefined;
  let currentId = $state<string | undefined>();
  const items: FocusFeedItem[] = [];

  const align = $derived(props.align ?? 'center');
  const viewportSize = $derived(props.h ?? 1080);

  function orderedItems() {
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const aElement = a.item.getElement();
        const bElement = b.item.getElement();

        if (aElement?.parent && aElement.parent === bElement?.parent) {
          return (
            aElement.parent.children.indexOf(aElement) -
            aElement.parent.children.indexOf(bElement)
          );
        }

        const aY = aElement?.y ?? 0;
        const bY = bElement?.y ?? 0;

        return aY === bY ? a.index - b.index : aY - bY;
      })
      .map(({ item }) => item);
  }

  function indexOf(id: string | undefined) {
    return id === undefined
      ? -1
      : orderedItems().findIndex((item) => item.id === id);
  }

  function register(item: FocusFeedItem) {
    items.push(item);

    return () => {
      const index = items.indexOf(item);
      if (index !== -1) items.splice(index, 1);
      if (currentId === item.id) currentId = undefined;
    };
  }

  function focusAt(index: number) {
    const item = orderedItems()[index];
    if (!item || !scroller) return false;

    currentId = item.id;
    focusIntoView(item.getElement(), {
      container: scroller,
      align,
      viewportSize,
      transition: props.scrollTransition,
      focus: false,
    });

    return item.setFocus() !== false;
  }

  function focusItem(id: string) {
    return focusAt(indexOf(id));
  }

  function focusNext(fromId = currentId) {
    return focusAt(indexOf(fromId) + 1);
  }

  function focusPrevious(fromId = currentId) {
    return focusAt(indexOf(fromId) - 1);
  }

  function setCurrentId(id: string) {
    currentId = id;
  }

  export function getElement() {
    return scroller?.element;
  }

  export function setFocus() {
    return focusAt(0);
  }

  export { focusItem, focusNext, focusPrevious };

  setFocusFeedContext({
    get align() {
      return align;
    },
    get viewportSize() {
      return viewportSize;
    },
    get scrollTransition() {
      return props.scrollTransition;
    },
    register,
    focusItem,
    focusNext,
    focusPrevious,
    setCurrentId,
  });

  const nodeProps = $derived.by(() => {
    const {
      children,
      align,
      scrollTransition,
      onLeftBoundary,
      onRightBoundary,
      onLeft,
      onRight,
      ...rest
    } = props;
    return rest;
  });
</script>

<View
  bind:this={scroller}
  {...nodeProps}
  display={props.display ?? 'flex'}
  flexDirection={props.flexDirection ?? 'column'}
  onLeft={chainFunctions(props.onLeft, props.onLeftBoundary)}
  onRight={chainFunctions(props.onRight, props.onRightBoundary)}
>
  {@render props.children?.()}
</View>
