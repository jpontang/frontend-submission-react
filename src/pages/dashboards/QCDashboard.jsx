import { ClipboardCheck, ClipboardX, ClipboardList } from 'lucide-react'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'

const PENDING_REVIEW = [
  { id: 1, barang: 'Kertas A4', suplayer: 'CV Sumber Jaya', qty: 50, status: 'pending' },
  { id: 2, barang: 'Tinta Printer', suplayer: 'Toko Abadi', qty: 12, status: 'pending' },
  { id: 3, barang: 'Spidol Whiteboard', suplayer: 'CV Sumber Jaya', qty: 30, status: 'active' },
]

const columns = [
  { key: 'barang', header: 'Barang' },
  { key: 'suplayer', header: 'Suplayer' },
  { key: 'qty', header: 'Qty' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

/**
 * Dashboard QC: ringkasan antrean review kualitas barang.
 */
export default function QCDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard QC</h1>
        <p className="text-sm text-slate-500">Ringkasan antrean review kualitas barang.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Review" value="18" icon={ClipboardList} accent="amber" />
        <StatCard label="Disetujui Bulan Ini" value="146" icon={ClipboardCheck} trend={9.4} accent="emerald" />
        <StatCard label="Ditolak Bulan Ini" value="7" icon={ClipboardX} trend={-2.1} accent="rose" />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Antrean Review</h3>
        <DataTable columns={columns} rows={PENDING_REVIEW} />
      </div>
    </div>
  )
}
