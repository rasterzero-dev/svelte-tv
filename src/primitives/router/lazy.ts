import type { RouteComponent } from './types.js';

export function lazy(loader: () => Promise<{ default: RouteComponent }>) {
  let component: RouteComponent | undefined;
  let promise: Promise<RouteComponent> | undefined;

  return {
    load() {
      if (component) return Promise.resolve(component);
      promise ??= loader().then((module) => {
        component = module.default;
        return component;
      });
      return promise;
    },
  };
}
