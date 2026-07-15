import { FileText, Users, Wallet, CircleCheck } from 'lucide-react'
import StatCard from '../../components/StatCard'
import RevenueChart from '../../components/RevenueChart'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'

const CHART_DATA = [
  { label: 'Jan', value: 24 },
  { label: 'Feb', value: 31 },
  { label: 'Mar', value: 28 },
  { label: 'Apr', value: 40 },
  { label: 'Mei', value: 35 },
  { label: 'Jun', value: 48 },
  { label: 'Jul', value: 42 },
]

const RECENT_PENGAJUAN = [
  { id: 1, kode: 'PJ-0231', unit: 'QC', total: 'Rp 4.200.000', status: 'pending' },
  { id: 2, kode: 'PJ-0230', unit: 'Finance', total: 'Rp 1.850.000', status: 'active' },
  { id: 3, kode: 'PJ-0229', unit: 'Gudang', total: 'Rp 9.100.000', status: 'rejected' },
  { id: 4, kode: 'PJ-0228', unit: 'Bendahara', total: 'Rp 2.400.000', status: 'active' },
]

const columns = [
  { key: 'kode', header: 'Kode' },
  { key: 'unit', header: 'Unit' },
  { key: 'total', header: 'Total' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
]

/**
 * Dashboard Admin: overview global lintas unit/role.
 */
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan aktivitas seluruh sistem hari ini.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pengajuan" value="1.284" icon={FileText} trend={8.2} accent="indigo" />
        <StatCard label="Total Users" value="56" icon={Users} trend={2.4} accent="emerald" />
        <StatCard label="Total Budget" value="Rp 120jt" icon={Wallet} trend={-3.1} accent="amber" />
        <StatCard label="Disetujui" value="932" icon={CircleCheck} trend={5.6} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={CHART_DATA} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Status Pengajuan</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Disetujui</span>
              <span className="font-semibold text-emerald-600">72%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Pending</span>
              <span className="font-semibold text-amber-600">21%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Ditolak</span>
              <span className="font-semibold text-rose-600">7%</span>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Pengajuan Terbaru</h3>
        <DataTable columns={columns} rows={RECENT_PENGAJUAN} />
      </div>
    </div>
  )
}
