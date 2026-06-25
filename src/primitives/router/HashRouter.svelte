<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { onDestroy, onMount } from 'svelte';
  import RouteView from './RouteView.svelte';
  import { clearRouterContext, setRouterContext } from './context.js';
  import { createLocation, matchRoutes, routeKey } from './match.js';
  import { setRouteParentContext } from './routeContext.js';
  import type {
    MatchedRoute,
    NavigateFn,
    RouteComponentProps,
    RouteDefinition,
    RouteLocation,
  } from './types.js';

  interface Props {
    root?: Component<RouteComponentProps>;
    children?: Snippet;
  }

  let props: Props = $props();
  let routes = $state<RouteDefinition[]>([]);
  let currentLocation = $state<RouteLocation>(createLocation(''));
  let activeChain = $state<MatchedRoute[]>([]);
  let activeData = $state<Record<string, unknown>>({});
  let preloadToken = 0;

  const activeParams = $derived(
    activeChain[activeChain.length - 1]?.params ?? {},
  );
  const activeRoute = $derived(activeChain[activeChain.length - 1]);

  const navigate: NavigateFn = (href, options) => {
    const path = href.startsWith('#') ? href.slice(1) : href;
    if (options?.replace) {
      window.history.replaceState(null, '', `#${path}`);
      currentLocation = createLocation(path);
      return;
    }

    window.location.hash = path;
  };

  const context = {
    registerRoute(route) {
      routes = [...routes, route];
      return () => {
        routes = routes.filter((item) => item !== route);
      };
    },
    navigate,
    location: () => currentLocation,
    params: () => activeParams,
    routeData: () => activeData,
    currentRoute: () => activeRoute,
  };

  setRouterContext(context);

  setRouteParentContext({
    registerRoute(route) {
      routes = [...routes, route];
      return () => {
        routes = routes.filter((item) => item !== route);
      };
    },
  });

  function updateLocation() {
    currentLocation = createLocation(window.location.hash);
  }

  $effect(() => {
    activeChain = matchRoutes(routes, currentLocation.path) ?? [];
  });

  $effect(() => {
    const redirect = activeChain[activeChain.length - 1]?.route.redirect;
    if (redirect) navigate(redirect, { replace: true });
  });

  $effect(() => {
    const chain = activeChain;
    const location = currentLocation;
    const params = activeParams;
    const currentToken = ++preloadToken;

    Promise.all(
      chain.map(async (match) => {
        if (!match.route.preload) return undefined;
        const data = await match.route.preload({
          params,
          location,
          navigate,
        });
        return [routeKey(match), data] as const;
      }),
    ).then((entries) => {
      if (currentToken !== preloadToken) return;

      const nextData: Record<string, unknown> = {};
      for (const entry of entries) {
        if (entry) nextData[entry[0]] = entry[1];
      }
      activeData = nextData;
    });
  });

  onMount(() => {
    updateLocation();
    window.addEventListener('hashchange', updateLocation);
  });

  onDestroy(() => {
    window.removeEventListener('hashchange', updateLocation);
    clearRouterContext(context);
  });
</script>

{@render props.children?.()}

{#snippet outlet()}
  {#if activeChain.length > 0}
    <RouteView
      chain={activeChain}
      params={activeParams}
      location={currentLocation}
      routeData={activeData}
      {navigate}
    />
  {/if}
{/snippet}

{#if props.root}
  {@const Root = props.root}
  <Root
    params={activeParams}
    location={currentLocation}
    routeData={activeData}
    {navigate}
    {outlet}
  />
{:else}
  {@render outlet()}
{/if}
