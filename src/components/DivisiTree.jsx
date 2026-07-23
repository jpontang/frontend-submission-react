import { useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Trash2, User } from 'lucide-react'
import { buildTree } from '../lib/divisiTree'

function TreeNode({ node, onEdit, onDelete, depth = 0 }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg py-1.5 pr-2 hover:bg-slate-50"
        style={{ paddingLeft: depth * 20 }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 ${
            hasChildren ? 'hover:bg-slate-200' : 'invisible'
          }`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
          <span className="font-medium">{node.nama_divisi}</span>
          {node.kode_divisi && (
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              {node.kode_divisi}
            </span>
          )}
        </span>

        {node.kepala?.nama_lengkap && (
          <span className="hidden shrink-0 items-center gap-1 text-xs text-slate-500 sm:flex">
            <User size={12} />
            {node.kepala.nama_lengkap}
          </span>
        )}

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            node.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {node.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>

        <div className="hidden shrink-0 gap-1 group-hover:flex">
          <button
            onClick={() => onEdit(node)}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(node)}
            className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="border-l border-slate-200" style={{ marginLeft: depth * 20 + 10 }}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} depth={1} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Tree view hirarki divisi (parent/child), dikelompokkan per lembaga
 * karena parent_divisi_id hanya bermakna dalam satu lembaga yang sama.
 */
export default function DivisiTree({ items, lembagaList, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
        Belum ada divisi
      </div>
    )
  }

  const groups = lembagaList
    .map((lembaga) => ({
      lembaga,
      divisiItems: items.filter((item) => item.lembaga_id === lembaga.id),
    }))
    .filter((group) => group.divisiItems.length > 0)

  return (
    <div className="space-y-4">
      {groups.map(({ lembaga, divisiItems }) => (
        <div key={lembaga.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">{lembaga.nama_lembaga}</h3>
          <div>
            {buildTree(divisiItems).map((node) => (
              <TreeNode key={node.id} node={node} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
