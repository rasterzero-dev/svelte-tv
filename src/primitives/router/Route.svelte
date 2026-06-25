<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import type {
    RouteDefinition,
    RoutePreload,
    RouteRenderable,
  } from './types.js';
  import {
    getRouteParentContext,
    setRouteParentContext,
  } from './routeContext.js';

  interface Props {
    id?: string;
    path?: string;
    component?: RouteRenderable;
    redirect?: string;
    preload?: RoutePreload;
    children?: Snippet;
  }

  let props: Props = $props();
  const parent = getRouteParentContext();
  const route: RouteDefinition = $state({
    path: '',
    children: [],
  });

  $effect(() => {
    route.id = props.id;
    route.path = props.path ?? '';
    route.component = props.component;
    route.redirect = props.redirect;
    route.preload = props.preload;
  });

  const unregister = parent?.registerRoute(route);

  setRouteParentContext({
    registerRoute(child) {
      route.children.push(child);
      return () => {
        route.children = route.children.filter((item) => item !== child);
      };
    },
  });

  onDestroy(() => unregister?.());
</script>

{@render props.children?.()}
