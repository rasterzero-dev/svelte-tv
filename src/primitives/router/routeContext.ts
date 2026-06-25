import { getContext, setContext } from 'svelte';
import type { RouteDefinition } from './types.js';

const routeParentContext = Symbol('svelte-tv-route-parent');

export type RouteParentContext = {
  registerRoute: (route: RouteDefinition) => () => void;
};

export function setRouteParentContext(value: RouteParentContext) {
  setContext(routeParentContext, value);
}

export function getRouteParentContext() {
  return getContext<RouteParentContext | undefined>(routeParentContext);
}
