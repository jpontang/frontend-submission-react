import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

const ITEMS = [
  { id: 1, barang: 'Kertas A4', suplayer: 'CV Sumber Jaya', qty: 50, status: 'pending' },
  { id: 2, barang: 'Tinta Printer', suplayer: 'Toko Abadi', qty: 12, status: 'active' },
  { id: 3, barang: 'Spidol Whiteboard', suplayer: 'CV Sumber Jaya', qty: 30, status: 'rejected' },
]

const columns = [
  { key: 'barang', header: 'Barang' },
  { key: 'suplayer', header: 'Suplayer' },
  { key: 'qty', header: 'Qty' },
  { key: 'status', header: 'Status QC', render: (row) => <StatusBadge status={row.status} /> },
]

export default function QCReview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">QC Review</h1>
          <p className="text-sm text-slate-500">Khusus QC &amp; Admin — review kualitas barang dari pengajuan.</p>
        </div>
      </div>

      <DataTable columns={columns} rows={ITEMS} />
    </div>
  )
}
