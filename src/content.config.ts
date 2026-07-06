import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { DOCS } from './lib/docs.mjs';

const docsLoader: Loader = {
  name: 'chalk-protocol-docs',
  async load({ store, renderMarkdown }) {
    const base =
      process.env.DOCS_BASE_URL ??
      'https://raw.githubusercontent.com/chalkagents/chalk-protocol/main';
    store.clear();
    for (const doc of DOCS) {
      const url = `${base}/${doc.file}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
      }
      const markdown = await res.text();
      if (!markdown.trim()) {
        throw new Error(`Fetched ${url} but the document is empty`);
      }
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
