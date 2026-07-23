/**
 * Menyusun list flat divisi (dengan parent_divisi_id) menjadi tree
 * bertingkat berdasarkan children. Node tanpa parent (atau induknya
 * tidak ada di `items`, mis. karena hasil pencarian) jadi root.
 */
export function buildTree(items) {
  const nodes = new Map(items.map((item) => [item.id, { ...item, children: [] }]))
  const roots = []

  nodes.forEach((node) => {
    const parent = node.parent_divisi_id ? nodes.get(node.parent_divisi_id) : null
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}
