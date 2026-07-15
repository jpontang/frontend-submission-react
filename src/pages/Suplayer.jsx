import DataTable from '../components/DataTable'

const BARANG = [
  { id: 1, nama: 'Kertas A4', kategori: 'ATK', harga: 'Rp 45.000', stok: 120 },
  { id: 2, nama: 'Tinta Printer', kategori: 'ATK', harga: 'Rp 85.000', stok: 40 },
  { id: 3, nama: 'Map Plastik', kategori: 'ATK', harga: 'Rp 3.500', stok: 300 },
]

const columns = [
  { key: 'nama', header: 'Nama Barang' },
  { key: 'kategori', header: 'Kategori' },
  { key: 'harga', header: 'Harga' },
  { key: 'stok', header: 'Stok' },
]

export default function Suplayer() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Katalog Barang</h1>
          <p className="text-sm text-slate-500">Khusus Suplayer &amp; Admin — kelola daftar barang yang ditawarkan.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          + Tambah Barang
        </button>
      </div>

      <DataTable columns={columns} rows={BARANG} />
    </div>
  )
}
