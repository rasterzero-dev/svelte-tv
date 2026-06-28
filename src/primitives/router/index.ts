export { default as HashRouter } from './HashRouter.svelte';
export { default as KeepAliveRoute } from './KeepAliveRoute.svelte';
export { default as Navigate } from './Navigate.svelte';
export { default as Route } from './Route.svelte';
export { location, navigate, params, route, routeData } from './context.js';
export { lazy } from './lazy.js';
export { createLocation, matchRoutes, normalizePath } from './match.js';
export type {
  LazyRouteComponent,
  MatchedRoute,
  NavigateFn,
  NavigateOptions,
  RouteComponent,
  RouteComponentProps,
  RouteDefinition,
  RouteLocation,
  RouteParams,
  RoutePreload,
  RoutePreloadArgs,
  RouteRenderable,
} from './types.js';
