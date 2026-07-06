import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://protocol.chalkagents.com',
  // Keep the content-layer store inside the project dir (default is node_modules/.astro).
  // Tests build sandboxed copies of the project with node_modules symlinked in; a
  // project-local cache dir means concurrent builds can never race on a shared store.
  cacheDir: './.astro-cache',
});
