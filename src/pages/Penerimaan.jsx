import { useEffect, useMemo, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'

/**
 * Referensi jenis biaya (kategori penerimaan/SPP) untuk role Bendahara.
 * Data diambil dari database siak lewat GET /api/getJenisBiaya.
 */
export default function Penerimaan() {
  const { jenisBiaya, loading, error, fetchJenisBiaya } = useApp()
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchJenisBiaya()
  }, [fetchJenisBiaya])

  const rows = useMemo(() => {
    const list = jenisBiaya || []
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((row) => row.nama_jenis_biaya?.toLowerCase().includes(q))
  }, [jenisBiaya, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Penerimaan</h1>
        <p className="text-sm text-slate-500">
          Referensi jenis biaya yang digunakan untuk mengelompokkan penerimaan/pembayaran.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jenis biaya..."
            className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
          />
        </div>
        <span className="whitespace-nowrap text-sm text-slate-500">
          {loading.jenisBiaya ? 'Memuat...' : `${rows.length} jenis biaya`}
        </span>
      </div>

      {error.jenisBiaya && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.jenisBiaya}
        </p>
      )}

      {loading.jenisBiaya ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          Tidak ada jenis biaya ditemukan.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Receipt size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {row.nama_jenis_biaya}
                </p>
                <p className="text-xs text-slate-400">Kode: {row.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
