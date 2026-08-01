import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react'
import DataTable from '../../components/DataTable'
import StatCard from '../../components/StatCard'
import api from '../../lib/api'

function formatRupiah(value) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_STYLES = {
  sukses: 'bg-emerald-50 text-emerald-700',
  dilewati: 'bg-amber-50 text-amber-700',
  gagal: 'bg-rose-50 text-rose-700',
}

/**
 * Riwayat eksekusi command cron (mis. yayasan:tambah-saldo-harian) - khusus
 * admin (dijaga backend lewat middleware 'admin' di routes/api.php, bukan
 * cuma disembunyikan di menu). Satu baris di tabel = satu unit yang
 * diproses pada satu kali eksekusi (lihat App\Models\Yayasan\CronLog).
 */
export default function CronLog() {
  const [list, setList] = useState([])
  const [tanggal, setTanggal] = useState(todayIso())
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function loadData() {
    setLoading(true)
    setError(null)
    const params = {}
    if (tanggal) params.tanggal = tanggal
    if (status) params.status = status

    api
      .get('/yayasan/cron-log', { params })
      .then(({ data }) => setList(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat log cron.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal, status])

  const ringkasan = useMemo(() => {
    return list.reduce(
      (acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1
        if (row.status === 'sukses') acc.totalNominal += Number(row.nominal) || 0
        return acc
      },
      { sukses: 0, dilewati: 0, gagal: 0, totalNominal: 0 }
    )
  }, [list])

  const columns = [
    {
      key: 'dijalankan_pada',
      header: 'Waktu',
      render: (row) =>
        row.dijalankan_pada
          ? new Date(row.dijalankan_pada).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : '-',
    },
    { key: 'command', header: 'Command' },
    {
      key: 'nama_divisi',
      header: 'Unit / Divisi',
      render: (row) => (
        <span>
          {row.nama_divisi || '-'}{' '}
          {row.kode_unit != null && <span className="text-xs text-slate-400">(kode_unit={row.kode_unit})</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'jumlah_pembayaran',
      header: 'Jumlah Pembayaran',
      render: (row) => row.jumlah_pembayaran ?? '-',
    },
    { key: 'nominal', header: 'Nominal', render: (row) => formatRupiah(row.nominal) },
    {
      key: 'kas_transaksi_id',
      header: 'Kode Transaksi',
      render: (row) => row.kas_transaksi?.kode_transaksi || '-',
    },
    { key: 'pesan', header: 'Pesan', render: (row) => <span className="text-xs text-slate-500">{row.pesan}</span> },
    {
      key: 'durasi_ms',
      header: 'Durasi',
      render: (row) => (row.durasi_ms != null ? `${row.durasi_ms} ms` : '-'),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Log Aktivitas Cron</h1>
          <p className="text-sm text-slate-500">
            Riwayat eksekusi command cron per unit - khusus Admin.
          </p>
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
            <option value="sukses">Sukses</option>
            <option value="dilewati">Dilewati</option>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sukses" value={ringkasan.sukses} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Dilewati" value={ringkasan.dilewati} icon={MinusCircle} accent="amber" />
        <StatCard label="Gagal" value={ringkasan.gagal} icon={XCircle} accent="rose" />
        <StatCard label="Total Saldo Ditambahkan" value={formatRupiah(ringkasan.totalNominal)} icon={CheckCircle2} />
      </div>

      <DataTable
        columns={columns}
        rows={list}
        emptyText={loading ? 'Memuat data...' : 'Belum ada riwayat cron.'}
      />
    </div>
  )
}
