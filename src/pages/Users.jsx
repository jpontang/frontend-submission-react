import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

const USERS = [
  { id: 1, name: 'Istiqomah', email: 'istiqomah@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Budi Santoso', email: 'budi@example.com', role: 'Bendahara', status: 'active' },
  { id: 3, name: 'Siti Aminah', email: 'siti@example.com', role: 'QC', status: 'inactive' },
  { id: 4, name: 'Rudi Hartono', email: 'rudi@example.com', role: 'Unit', status: 'pending' },
]

const columns = [
  { key: 'name', header: 'Nama' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
]

export default function Users() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Kelola pengguna dan hak akses.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          + Tambah User
        </button>
      </div>

      <DataTable columns={columns} rows={USERS} />
    </div>
  )
}
