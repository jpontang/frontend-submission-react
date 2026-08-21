import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'
import api from '../lib/api'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Riwayat pengiriman WhatsApp (khusus Admin/Bendahara) - dari
 * tbl_whatsapp_logs, dicatat otomatis tiap kali
 * App\Http\Controllers\Broadcast\WhatsappController::api_whatsapp()
 * dipanggil (mis. tombol "Kirim via WhatsApp" di detail Pengajuan).
 * Menampilkan 200 baris terbaru sesuai filter - lihat
 * WhatsappLogController::index().
 */
export default function WhatsappLog() {
  const [list, setList] = useState([])
  const [tanggal, setTanggal] = useState(todayIso())
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)

  function loadData() {
    setLoading(true)
    setError(null)
    const params = {}
    if (tanggal) params.tanggal = tanggal
    if (status) params.status = status

    api
      .get('/whatsapp-log', { params })
      .then(({ data }) => setList(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat log WhatsApp.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal, status])

  const ringkasan = useMemo(() => {
    return list.reduce(
      (acc, row) => {
        if (row.berhasil) acc.berhasil += 1
        else acc.gagal += 1
        return acc
      },
      { berhasil: 0, gagal: 0 }
    )
  }, [list])

  const columns = [
    {
      key: 'created_at',
      header: 'Waktu',
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
          : '-',
    },
    { key: 'vendor', header: 'Vendor', render: (row) => <span className="capitalize">{row.vendor || '-'}</span> },
    { key: 'nomor_tujuan', header: 'Nomor Tujuan' },
    {
      key: 'referensi',
      header: 'Referensi',
      render: (row) => <span className="text-slate-600">{row.referensi || '-'}</span>,
    },
    {
      key: 'berhasil',
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            row.berhasil ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {row.berhasil ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {row.berhasil ? 'Berhasil' : 'Gagal'}
        </span>
      ),
    },
    {
      key: 'dikirim_oleh',
      header: 'Dikirim Oleh',
      render: (row) => row.pengirim?.name || '-',
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => setDetail(row)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Detail
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Log WhatsApp</h1>
          <p className="text-sm text-slate-500">Riwayat pengiriman WhatsApp lewat sistem - khusus Admin/Bendahara.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua Status</option>
            <option value="berhasil">Berhasil</option>
            <option value="gagal">Gagal</option>
          </select>
          {tanggal && (
            <button
              onClick={() => setTanggal('')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Semua Tanggal
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Berhasil" value={ringkasan.berhasil} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Gagal" value={ringkasan.gagal} icon={XCircle} accent="rose" />
      </div>

      <DataTable columns={columns} rows={list} emptyText={loading ? 'Memuat data...' : 'Belum ada riwayat pengiriman.'} />

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Detail Pengiriman"
        footer={
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>
        }
      >
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">Pesan</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-slate-700">{detail?.pesan}</dd>
          </div>
          {detail?.error && (
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Error</dt>
              <dd className="mt-0.5 text-rose-600">{detail.error}</dd>
            </div>
          )}
          {detail?.response && (
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Respons Vendor (mentah)</dt>
              <dd className="mt-0.5 break-all font-mono text-xs text-slate-500">{detail.response}</dd>
            </div>
          )}
        </dl>
      </Modal>
    </div>
  )
}
