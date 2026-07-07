import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { DOCS } from './lib/docs.mjs';
import { fetchDoc } from './lib/fetch-doc.mjs';

const docsLoader: Loader = {
  name: 'chalk-protocol-docs',
  async load({ store, renderMarkdown }) {
    const base =
      process.env.DOCS_BASE_URL ??
      'https://raw.githubusercontent.com/chalkagents/chalk-protocol/main';
    store.clear();
    for (const doc of DOCS) {
      const url = `${base}/${doc.file}`;
      // Retries transient failures (network / timeout / 5xx); fails hard on 404 or empty.
      const markdown = await fetchDoc(url);
      store.set({
        id: doc.id,
        data: { title: doc.title, file: doc.file },
        rendered: await renderMarkdown(markdown),
      });
    }
  },
};

const docs = defineCollection({
  loader: docsLoader,
  schema: z.object({ title: z.string(), file: z.string() }),
});

export const collections = { docs };
