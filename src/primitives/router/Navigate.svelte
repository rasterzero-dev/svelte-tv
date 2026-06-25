<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from './context.js';
  import type { NavigateOptions } from './types.js';

  interface Props extends NavigateOptions {
    href: string;
  }

  let props: Props = $props();

  onMount(() => navigate(props.href, { replace: props.replace }));
</script>
