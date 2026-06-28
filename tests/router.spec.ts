import { describe, expect, it } from 'vitest';
import {
  createLocation,
  matchRoutes,
  normalizePath,
  type RouteDefinition,
} from '../src/primitives/router/index.js';

function route(
  path: string,
  children: RouteDefinition[] = [],
): RouteDefinition {
  return { path, children };
}

describe('router', () => {
  it('normalizes paths and hash locations', () => {
    expect(normalizePath('browse/all/')).toBe('/browse/all');
    expect(normalizePath('#/browse/all?x=1')).toBe('/browse/all');

    const location = createLocation('#/browse/all?filter=popular');
    expect(location.path).toBe('/browse/all');
    expect(location.query.get('filter')).toBe('popular');
  });

  it('matches nested routes with params', () => {
    const routes = [
      route('', [route('browse/:filter'), route('entity/:type/:id')]),
    ];

    const match = matchRoutes(routes, '/entity/movie/42');

    expect(match?.map((item) => item.route.path)).toEqual([
      '',
      'entity/:type/:id',
    ]);
    expect(match?.at(-1)?.params).toEqual({ type: 'movie', id: '42' });
  });

  it('prefers static routes over params', () => {
    const routes = [route('', [route('browse/:filter'), route('browse/all')])];

    const match = matchRoutes(routes, '/browse/all');

    expect(match?.at(-1)?.route.path).toBe('browse/all');
  });

  it('matches splat routes', () => {
    const routes = [route('', [route('*all')])];

    const match = matchRoutes(routes, '/missing/deep/path');

    expect(match?.at(-1)?.params).toEqual({ all: 'missing/deep/path' });
  });
});
