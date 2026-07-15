import StatCard from '../components/StatCard'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { Wallet, TrendingDown, TrendingUp } from 'lucide-react'

const BUDGET = [
  { id: 1, unit: 'QC', dialokasikan: 'Rp 15.000.000', terpakai: 'Rp 9.200.000', status: 'active' },
  { id: 2, unit: 'Gudang', dialokasikan: 'Rp 8.000.000', terpakai: 'Rp 7.850.000', status: 'pending' },
  { id: 3, unit: 'Finance', dialokasikan: 'Rp 12.000.000', terpakai: 'Rp 4.100.000', status: 'active' },
]

const columns = [
  { key: 'unit', header: 'Unit' },
  { key: 'dialokasikan', header: 'Dialokasikan' },
  { key: 'terpakai', header: 'Terpakai' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

export default function BudgetControl() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Budget Control</h1>
        <p className="text-sm text-slate-500">Khusus Bendahara &amp; Admin — pantau alokasi budget tiap unit.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Budget" value="Rp 35jt" icon={Wallet} accent="indigo" />
        <StatCard label="Terpakai" value="Rp 21,1jt" icon={TrendingDown} accent="rose" />
        <StatCard label="Sisa Budget" value="Rp 13,9jt" icon={TrendingUp} accent="emerald" />
      </div>

      <DataTable columns={columns} rows={BUDGET} />
    </div>
  )
}
