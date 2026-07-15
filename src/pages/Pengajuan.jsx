import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

const PENGAJUAN = [
  { id: 1, kode: 'PJ-0231', unit: 'QC', pemohon: 'Siti Aminah', total: 'Rp 4.200.000', status: 'pending' },
  { id: 2, kode: 'PJ-0230', unit: 'Finance', pemohon: 'Budi Santoso', total: 'Rp 1.850.000', status: 'active' },
  { id: 3, kode: 'PJ-0229', unit: 'Gudang', pemohon: 'Rudi Hartono', total: 'Rp 9.100.000', status: 'rejected' },
  { id: 4, kode: 'PJ-0228', unit: 'Bendahara', pemohon: 'Istiqomah', total: 'Rp 2.400.000', status: 'active' },
  { id: 5, kode: 'PJ-0227', unit: 'QC', pemohon: 'Siti Aminah', total: 'Rp 750.000', status: 'pending' },
]

const columns = [
  { key: 'kode', header: 'Kode' },
  { key: 'unit', header: 'Unit' },
  { key: 'pemohon', header: 'Pemohon' },
  { key: 'total', header: 'Total' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
]

export default function Pengajuan() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pengajuan</h1>
        <p className="text-sm text-slate-500">Daftar seluruh pengajuan dari semua unit.</p>
      </div>

      <DataTable columns={columns} rows={PENGAJUAN} />
    </div>
  )
}
