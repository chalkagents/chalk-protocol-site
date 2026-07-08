import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
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

// Blog posts live locally in src/content/blog as Markdown — unlike docs, they are the
// site's own writing, not mirrored from the upstream repo.
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().default('Chalk Agents'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { docs, blog };
