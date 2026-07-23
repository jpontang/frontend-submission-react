import { useEffect, useState } from 'react'
import Modal from './Modal'
import api from '../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/**
 * Detail besaran tagihan SPP tiap siswa dalam satu kelas untuk satu periode
 * (id_record_tagihan like '2606%', tanpa filter status), dibuka saat node
 * kelas di SiswaSppTree diklik. Fetch on-demand lewat POST /sppSiswaKelas
 * (lihat BudgetControlController::sppSiswaKelas) - tidak lewat AppContext
 * karena butuh parameter id_kelas per klik, beda dari resource statis lain.
 */
export default function SppSiswaKelasModal({ open, onClose, kelas }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !kelas?.id_kelas) return

    setLoading(true)
    setError(null)
    api
      .post('/sppSiswaKelas', { id_kelas: kelas.id_kelas })
      .then(({ data }) => setRows(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat data siswa.'))
      .finally(() => setLoading(false))
  }, [open, kelas])

  const total = rows.reduce((sum, row) => sum + Number(row.total_nilai_tagihan || 0), 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Tagihan SPP - ${kelas?.nama || ''}`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Okay
        </button>
      }
    >
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada tagihan SPP untuk periode ini di kelas ini.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{rows.length} siswa</span>
            <span>Total: {formatRupiah(total)}</span>
          </div>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {rows.map((row) => (
              <div
                key={row.nomor_induk}
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{row.nama}</p>
                  <p className="text-xs text-slate-400">NIS: {row.nomor_induk}</p>
                  <p className="text-xs text-slate-400">No. Tagihan: {row.id_record_tagihan}</p>
                </div>
                <span className="whitespace-nowrap font-semibold text-indigo-700">
                  {formatRupiah(row.total_nilai_tagihan)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
