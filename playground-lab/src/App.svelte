<script lang="ts">
  import {
    HashRouter,
    LightningRoot,
    loadGeneratedFonts,
    Route,
  } from '../../src/index.js';
  import LabPage from './LabPage.svelte';
</script>

<LightningRoot target="app" onReady={() => loadGeneratedFonts()}>
  <HashRouter>
    <Route path="" component={LabPage} />
    <Route path=":section" component={LabPage} />
  </HashRouter>
</LightningRoot>
