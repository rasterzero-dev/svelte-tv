import { getContext, setContext } from 'svelte';
import type { RouteContextValue } from './types.js';

const routerContext = Symbol('svelte-tv-router');

export function setRouterContext(value: RouteContextValue) {
  setContext(routerContext, value);
}

export function getRouterContext() {
  const context = getContext<RouteContextValue | undefined>(routerContext);
  if (!context) {
    throw new Error('Router context is not available.');
  }
  return context;
}

export function navigate(...args: Parameters<RouteContextValue['navigate']>) {
  return getRouterContext().navigate(...args);
}

export function params() {
  return getRouterContext().params();
}

export function location() {
  return getRouterContext().location();
}

export function routeData() {
  return getRouterContext().routeData();
}

export function route() {
  return getRouterContext().currentRoute();
}
