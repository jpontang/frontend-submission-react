import { Package, ShoppingCart, Clock } from 'lucide-react'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'

const PESANAN = [
  { id: 1, kode: 'PO-0091', barang: 'Kertas A4', qty: 50, status: 'pending' },
  { id: 2, kode: 'PO-0090', barang: 'Tinta Printer', qty: 12, status: 'active' },
  { id: 3, kode: 'PO-0089', barang: 'Map Plastik', qty: 100, status: 'active' },
]

const columns = [
  { key: 'kode', header: 'Kode PO' },
  { key: 'barang', header: 'Barang' },
  { key: 'qty', header: 'Qty' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

/**
 * Dashboard Suplayer: ringkasan pesanan masuk & katalog barang.
 */
export default function SuplayerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Suplayer</h1>
        <p className="text-sm text-slate-500">Ringkasan pesanan masuk dan status katalog barang Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Barang" value="24" icon={Package} accent="indigo" />
        <StatCard label="Pesanan Masuk" value="9" icon={ShoppingCart} trend={3.5} accent="emerald" />
        <StatCard label="Menunggu Konfirmasi" value="3" icon={Clock} accent="amber" />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Pesanan Terbaru</h3>
        <DataTable columns={columns} rows={PESANAN} />
      </div>
    </div>
  )
}
