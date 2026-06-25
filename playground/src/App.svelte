<script lang="ts">
  import {
    FPSCounter,
    HashRouter,
    LightningRoot,
    loadGeneratedFonts,
    Route,
  } from '../../src/index.js';
  import DemoShell from './DemoShell.svelte';
</script>

<LightningRoot
  target="app"
  onReady={() => loadGeneratedFonts()}
  keyHoldOptions={{
    userKeyHoldMap: {
      LeftHold: 'ArrowLeft',
      RightHold: 'ArrowRight',
    },
    holdThreshold: 180,
  }}
>
  <HashRouter>
    <Route path="" component={DemoShell} />
    <Route path=":section" component={DemoShell} />
  </HashRouter>
</LightningRoot>
