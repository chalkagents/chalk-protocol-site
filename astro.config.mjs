import { defineConfig } from 'astro/config';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { headingAnchors } from './src/lib/heading-anchors.mjs';

export default defineConfig({
  site: 'https://protocol.chalkagents.com',
  // Keep the content-layer store inside the project dir (default is node_modules/.astro).
  // Tests build sandboxed copies of the project with node_modules symlinked in; a
  // project-local cache dir means concurrent builds can never race on a shared store.
  cacheDir: './.astro-cache',
  // Same isolation for vite's dep-optimizer cache: its default (node_modules/.vite) is
  // SHARED by test sandboxes that symlink node_modules in — concurrent builds race on
  // the deps dir rename (ENOTEMPTY). Project-local means every build owns its cache.
  vite: { cacheDir: './.vite-cache' },
  build: {
    // One page, one request: inline all styles. Also lets the test suite assert on
    // CSS-delivered behavior (reduced-motion guards) straight from the built HTML.
    inlineStylesheets: 'always',
  },
  markdown: {
    // Astro's built-in heading-id pass runs AFTER user rehype plugins, so apply it
    // explicitly first — headingAnchors needs the ids to build its `#…` links.
    rehypePlugins: [rehypeHeadingIds, headingAnchors],
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
