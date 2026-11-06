const allowedTags = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI',
  'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'PRE', 'CODE', 'HR',
])

const droppedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE'])

/** Defense-in-depth for CMS markup before it reaches dangerouslySetInnerHTML. */
export function sanitizePageContent(html: string): string {
  const document = new DOMParser().parseFromString(`<div id="page-content-root">${html}</div>`, 'text/html')
  const root = document.getElementById('page-content-root')
  if (!root) return ''

  const sanitizeChildren = (parent: ParentNode) => {
    for (const child of Array.from(parent.childNodes)) {
      if (!(child instanceof Element)) continue

      if (droppedTags.has(child.tagName)) {
        child.remove()
        continue
      }

      sanitizeChildren(child)

      if (allowedTags.has(child.tagName)) {
        for (const attribute of Array.from(child.attributes)) child.removeAttributeNode(attribute)
        continue
      }

      child.replaceWith(...Array.from(child.childNodes))
    }
  }

  sanitizeChildren(root)
  return root.innerHTML
}
