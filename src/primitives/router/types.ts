import type { Component, Snippet } from 'svelte';

export type RouteParams = Record<string, string>;

export interface RouteLocation {
  path: string;
  hash: string;
  query: URLSearchParams;
  state: unknown;
}

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export type NavigateFn = (href: string, options?: NavigateOptions) => void;

export type RoutePreloadArgs = {
  params: RouteParams;
  location: RouteLocation;
  navigate: NavigateFn;
};

export type RoutePreload = (
  args: RoutePreloadArgs,
) => unknown | Promise<unknown>;

export type RouteComponentProps = {
  params: RouteParams;
  location: RouteLocation;
  data?: unknown;
  routeData: Record<string, unknown>;
  navigate: NavigateFn;
  outlet?: Snippet;
  isAlive?: boolean;
};

export type RouteComponent = Component<any>;

export type LazyRouteComponent = {
  load: () => Promise<RouteComponent>;
};

export type RouteRenderable = RouteComponent | LazyRouteComponent;

export interface RouteDefinition {
  id?: string;
  path: string;
  component?: RouteRenderable;
  redirect?: string;
  preload?: RoutePreload;
  keepAlive?: boolean;
  children: RouteDefinition[];
}

export type MatchedRoute = {
  route: RouteDefinition;
  params: RouteParams;
  fullPath: string;
};

export type RouteContextValue = {
  registerRoute: (route: RouteDefinition) => () => void;
  navigate: NavigateFn;
  location: () => RouteLocation;
  params: () => RouteParams;
  routeData: () => Record<string, unknown>;
  currentRoute: () => MatchedRoute | undefined;
};
