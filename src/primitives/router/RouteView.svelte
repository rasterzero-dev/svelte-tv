<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import RouteView from './RouteView.svelte';
  import type {
    MatchedRoute,
    NavigateFn,
    RouteComponent,
    RouteLocation,
  } from './types.js';
  import { routeKey } from './match.js';

  interface Props {
    chain: MatchedRoute[];
    params: Record<string, string>;
    location: RouteLocation;
    routeData: Record<string, unknown>;
    navigate: NavigateFn;
    depth?: number;
  }

  let props: Props = $props();
  let component = $state<RouteComponent | undefined>();
  let token = 0;

  const depth = $derived(props.depth ?? 0);
  const match = $derived(props.chain[depth]);
  const nextDepth = $derived(depth + 1);
  const hasOutlet = $derived(nextDepth < props.chain.length);
  const data = $derived(match ? props.routeData[routeKey(match)] : undefined);
  const isAlive = $derived(match?.route.keepAlive === true);

  $effect(() => {
    const current = match?.route.component;
    const currentToken = ++token;
    component = undefined;

    if (!current) return;
    if ('load' in current) {
      current.load().then((loaded) => {
        if (currentToken === token) component = loaded;
      });
      return;
    }

    component = current as RouteComponent;
  });
</script>

{#if component && match}
  {@const Component = component}
  {#snippet outlet()}
    {#if hasOutlet}
      <RouteView
        chain={props.chain}
        params={props.params}
        location={props.location}
        routeData={props.routeData}
        navigate={props.navigate}
        depth={nextDepth}
      />
    {/if}
  {/snippet}

  <Component
    params={props.params}
    location={props.location}
    {data}
    routeData={props.routeData}
    navigate={props.navigate}
    {outlet}
    {isAlive}
  />
{:else if hasOutlet}
  <RouteView
    chain={props.chain}
    params={props.params}
    location={props.location}
    routeData={props.routeData}
    navigate={props.navigate}
    depth={nextDepth}
  />
{/if}
