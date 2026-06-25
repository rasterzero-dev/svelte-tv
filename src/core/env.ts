import { DEV } from 'esm-env';

export const isDev = DEV;

const globalFlags = globalThis as typeof globalThis & {
  SVELTE_TV_DISABLE_SHADERS?: boolean;
};

/** Whether element shaders are enabled */
export const SHADERS_ENABLED = globalFlags.SVELTE_TV_DISABLE_SHADERS !== true;
