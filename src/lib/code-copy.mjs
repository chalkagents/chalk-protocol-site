// Rehype plugin: wrap each Shiki <pre> in a .code-block container with a copy button.
// Zero-dependency (mirrors src/lib/heading-anchors.mjs). The button carries no code
// payload — the client handler reads the sibling <pre>'s textContent at click time, so
// there's no duplication and nothing to escape.
export function codeCopy() {
  return function transform(tree) {
    wrapPres(tree);
  };
}

function wrapPres(node) {
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'element' && child.tagName === 'pre') {
      children[i] = {
        type: 'element',
        tagName: 'div',
        properties: { class: 'code-block' },
        children: [
          {
            type: 'element',
            tagName: 'button',
            properties: { type: 'button', class: 'code-copy', 'aria-label': 'Copy code' },
            children: [{ type: 'text', value: 'copy' }],
          },
          child,
        ],
      };
      continue; // don't descend into the code we just wrapped
    }
    wrapPres(child);
  }
}
