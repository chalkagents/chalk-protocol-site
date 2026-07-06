// Rehype plugin: append a hover-revealed anchor link to h2–h6 headings that have
// an id (Astro's rehypeHeadingIds must run before this plugin — see astro.config.mjs).
// h1 is intentionally skipped: the docs contract asserts each page's h1 renders as
// plain `<h1>text</h1>` with no trailing markup.
const ANCHORED = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

export function headingAnchors() {
  return function transform(tree) {
    walk(tree);
  };
}

function walk(node) {
  if (node.type === 'element' && ANCHORED.has(node.tagName)) {
    const id = node.properties?.id;
    if (typeof id === 'string' && id.length > 0) {
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          class: 'heading-anchor',
          href: `#${id}`,
          'aria-label': 'Link to this section',
        },
        children: [{ type: 'text', value: '#' }],
      });
    }
    return; // never descend into headings — no nested anchors
  }
  for (const child of node.children ?? []) {
    walk(child);
  }
}
