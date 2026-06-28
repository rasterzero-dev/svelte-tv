import type {
  MatchedRoute,
  RouteDefinition,
  RouteLocation,
  RouteParams,
} from './types.js';

type Candidate = {
  chain: MatchedRoute[];
  score: number;
};

export function normalizePath(path: string | undefined) {
  if (!path) return '/';
  const withoutHash = path.startsWith('#') ? path.slice(1) : path;
  const [pathname = ''] = withoutHash.split('?');
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return normalized.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function createLocation(hash: string): RouteLocation {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  const [path = '/', query = ''] = value.split('?');
  return {
    path: normalizePath(path),
    hash: `#${value}`,
    query: new URLSearchParams(query),
  };
}

export function routeKey(match: MatchedRoute) {
  return match.route.id ?? match.fullPath;
}

export function matchRoutes(routes: RouteDefinition[], path: string) {
  const segments = splitPath(path);
  const candidates = matchChildren(routes, segments, 0, {}, '', []);
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.chain;
}

function splitPath(path: string) {
  const normalized = normalizePath(path);
  if (normalized === '/') return [];
  return normalized.slice(1).split('/').filter(Boolean);
}

function splitRoutePath(path: string) {
  const normalized = path === '' ? '' : normalizePath(path);
  if (normalized === '' || normalized === '/') return [];
  return normalized.slice(1).split('/').filter(Boolean);
}

function matchChildren(
  routes: RouteDefinition[],
  segments: string[],
  index: number,
  params: RouteParams,
  basePath: string,
  chain: MatchedRoute[],
): Candidate[] {
  const candidates: Candidate[] = [];

  for (const route of routes) {
    const result = matchRoute(route.path, segments, index, params);
    if (!result) continue;

    const fullPath = joinPaths(basePath, route.path);
    const nextChain = [...chain, { route, params: result.params, fullPath }];
    const nextIndex = result.index;
    const score = result.score;

    if (route.children.length > 0) {
      for (const child of matchChildren(
        route.children,
        segments,
        nextIndex,
        result.params,
        fullPath,
        nextChain,
      )) {
        candidates.push({ chain: child.chain, score: score + child.score });
      }
    }

    if (nextIndex === segments.length) {
      candidates.push({ chain: nextChain, score });
    }
  }

  return candidates;
}

function matchRoute(
  path: string,
  segments: string[],
  index: number,
  params: RouteParams,
) {
  const routeSegments = splitRoutePath(path);
  const nextParams = { ...params };
  let score = routeSegments.length === 0 ? 1 : 0;
  let currentIndex = index;

  for (const routeSegment of routeSegments) {
    if (routeSegment.startsWith('*')) {
      const name = routeSegment.slice(1);
      if (name) nextParams[name] = segments.slice(currentIndex).join('/');
      return {
        index: segments.length,
        params: nextParams,
        score: score + 1,
      };
    }

    const segment = segments[currentIndex];
    if (segment === undefined) return undefined;

    if (routeSegment.startsWith(':')) {
      nextParams[routeSegment.slice(1)] = decodeURIComponent(segment);
      score += 2;
    } else if (routeSegment === segment) {
      score += 3;
    } else {
      return undefined;
    }

    currentIndex += 1;
  }

  return {
    index: currentIndex,
    params: nextParams,
    score,
  };
}

function joinPaths(basePath: string, path: string) {
  if (path === '') return basePath || '/';
  return normalizePath(`${basePath}/${path}`);
}
