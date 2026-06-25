import { getContext, setContext } from 'svelte';
import type { RouteContextValue } from './types.js';

const routerContext = Symbol('svelte-tv-router');
let activeRouterContext: RouteContextValue | undefined;

export function setRouterContext(value: RouteContextValue) {
  activeRouterContext = value;
  setContext(routerContext, value);
}

export function clearRouterContext(value: RouteContextValue) {
  if (activeRouterContext === value) activeRouterContext = undefined;
}

export function getRouterContext() {
  let context: RouteContextValue | undefined;
  try {
    context = getContext<RouteContextValue | undefined>(routerContext);
  } catch (error) {
    if (activeRouterContext) return activeRouterContext;
    throw error;
  }

  if (!context) {
    if (activeRouterContext) return activeRouterContext;
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
