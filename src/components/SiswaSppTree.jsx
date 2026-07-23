import { useState } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function TreeNode({ node, depth = 0, onSelectKelas }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children.length > 0
  const isKelas = Boolean(node.id_kelas)

  return (
    <div>
      <div
        className={`group flex items-center gap-2 rounded-lg py-1.5 pr-2 hover:bg-slate-50 ${
          isKelas ? 'cursor-pointer' : ''
        }`}
        style={{ paddingLeft: depth * 20 }}
        onClick={isKelas ? () => onSelectKelas(node) : undefined}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 ${
            hasChildren ? 'hover:bg-slate-200' : 'invisible'
          }`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span
          className={`min-w-0 flex-1 truncate text-sm font-medium ${
            isKelas ? 'text-indigo-700 hover:underline' : 'text-slate-800'
          }`}
        >
          {node.nama}
        </span>

        <span className="hidden shrink-0 items-center gap-1 text-xs text-slate-500 sm:flex">
          <Users size={12} />
          {node.totalSiswa} siswa
        </span>

        {node.totalSpp !== null && (
          <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {formatRupiah(node.totalSpp)}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="border-l border-slate-200" style={{ marginLeft: depth * 20 + 10 }}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onSelectKelas={onSelectKelas} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Tree Sekolah/Yayasan -> Unit -> Kelas, menampilkan total siswa aktif &
 * total tagihan SPP tiap tingkat. `tree` dibangun lewat
 * lib/siswaSppTree.js#buildSiswaSppTree. Node kelas (punya `id_kelas`) bisa
 * diklik - panggil `onSelectKelas(node)` supaya pemanggil bisa buka modal
 * detail tagihan per siswa (POST /sppSiswaKelas).
 */
export default function SiswaSppTree({ tree, onSelectKelas }) {
  if (!tree || tree.children.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
        Belum ada data.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <TreeNode node={tree} onSelectKelas={onSelectKelas} />
    </div>
  )
}