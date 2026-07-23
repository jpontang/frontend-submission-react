import { Pencil, Trash2, User } from 'lucide-react'
import { buildTree } from '../lib/divisiTree'
import './DivisiOrgChart.css'

function OrgChartCard({ node, onEdit, onDelete }) {
  return (
    <div className="group relative inline-flex min-w-[160px] flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-slate-800">{node.nama_divisi}</span>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${node.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}
          title={node.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        />
      </div>

      {node.kode_divisi && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{node.kode_divisi}</span>
      )}

      {node.kepala?.nama_lengkap && (
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <User size={11} />
          {node.kepala.nama_lengkap}
        </span>
      )}

      <div className="absolute -top-2 -right-2 hidden gap-1 group-hover:flex">
        <button
          onClick={() => onEdit(node)}
          className="rounded-full bg-white p-1 text-slate-400 shadow ring-1 ring-slate-200 hover:text-indigo-600"
          title="Edit"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onDelete(node)}
          className="rounded-full bg-white p-1 text-slate-400 shadow ring-1 ring-slate-200 hover:text-rose-600"
          title="Hapus"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function OrgChartNode({ node, onEdit, onDelete }) {
  return (
    <li>
      <OrgChartCard node={node} onEdit={onEdit} onDelete={onDelete} />
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgChartNode key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * Org chart visual (kotak + garis penghubung) hirarki divisi,
 * dikelompokkan per lembaga sama seperti tree view.
 */
export default function DivisiOrgChart({ items, lembagaList, onEdit, onDelete }) {
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
    <div className="space-y-6">
      {groups.map(({ lembaga, divisiItems }) => (
        <div key={lembaga.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">{lembaga.nama_lembaga}</h3>
          <div className="overflow-x-auto pb-2">
            <ul className="org-chart min-w-fit">
              {buildTree(divisiItems).map((node) => (
                <OrgChartNode key={node.id} node={node} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
