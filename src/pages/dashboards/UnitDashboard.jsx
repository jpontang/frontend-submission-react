import StatCard from '../../components/StatCard'
import RevenueChart from '../../components/RevenueChart'
import { FileText, Wallet } from 'lucide-react'

const CHART_DATA = [
  { label: 'Jan', value: 5 },
  { label: 'Feb', value: 8 },
  { label: 'Mar', value: 6 },
  { label: 'Apr', value: 11 },
  { label: 'Mei', value: 9 },
  { label: 'Jun', value: 14 },
]

/**
 * Dashboard Unit Sekolah & Unit Departemen: ringkasan pengajuan unit sendiri.
 */
export default function UnitDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Unit</h1>
        <p className="text-sm text-slate-500">Ringkasan pengajuan &amp; kas unit Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Pengajuan Bulan Ini" value="14" icon={FileText} trend={12.5} accent="indigo" />
        <StatCard label="Kas Tersisa" value="Rp 6,2jt" icon={Wallet} trend={-4.3} accent="amber" />
      </div>

      <RevenueChart data={CHART_DATA} title="Pengajuan Unit per Bulan" />
    </div>
  )
}
