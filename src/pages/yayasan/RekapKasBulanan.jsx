import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'
import DataTable from '../../components/DataTable'
import StatCard from '../../components/StatCard'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function bulanIni() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function geserBulan(bulan, delta) {
  const [tahun, bln] = bulan.split('-').map(Number)
  const d = new Date(tahun, bln - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function labelBulan(bulan) {
  const [tahun, bln] = bulan.split('-').map(Number)
  return new Date(tahun, bln - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

/**
 * Rekap saldo kas masuk & keluar per bulan, dipecah per divisi + divisi
 * parent (khusus Admin) - dari GET /yayasan/kas-transaksi/rekap-bulanan.
 * Beda dgn KasTransaksi.jsx (riwayat per transaksi) atau saldo-berjalan di
 * dashboard QC/Divisi (snapshot saat ini): di sini pergerakan dibatasi ke
 * SATU bulan yang dipilih, supaya kelihatan "bulan ini masuk berapa, keluar
 * berapa" per divisi - dgn navigasi bulan sebelum/sesudahnya.
 */
export default function RekapKasBulanan() {
  const [bulan, setBulan] = useState(bulanIni())
  const [data, setData] = useState([])
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback((bulanDipilih) => {
    setLoading(true)
    setError(null)
    api
      .get('/yayasan/kas-transaksi/rekap-bulanan', { params: { bulan: bulanDipilih } })
      .then(({ data: res }) => {
        setData(res.data)
        setTotal(res.total)
      })
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat rekap kas bulanan.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData(bulan)
  }, [bulan, loadData])

  // Nama induk divisi diambil dari dataset yang sama (parent_divisi_id ->
  // nama_divisi), supaya baris anak divisi bisa nunjukin nama induknya
  // tanpa request tambahan.
  const namaDivisiMap = useMemo(() => new Map(data.map((d) => [d.id, d.nama_divisi])), [data])

  const columns = [
    {
      key: 'nama_divisi',
      header: 'Divisi',
      render: (row) => (
        <span className={row.parent_divisi_id ? 'pl-4 text-slate-700' : 'font-semibold text-slate-900'}>
          {row.parent_divisi_id ? `— ${row.nama_divisi}` : row.nama_divisi}
        </span>
      ),
    },
    {
      key: 'parent_divisi_id',
      header: 'Induk Divisi',
      render: (row) => (row.parent_divisi_id ? namaDivisiMap.get(row.parent_divisi_id) || '-' : '-'),
    },
    {
      key: 'nama_unit_siak',
      header: 'Unit',
      // Tidak semua divisi Yayasan punya padanan unit sekolah SIAK (mis.
      // Divisi Keuangan, Sarana Prasarana) - lihat kode_unit_siak di
      // KasTransaksiController::rekapBulanan().
      render: (row) => row.nama_unit_siak || <span className="text-slate-400">-</span>,
    },
    { key: 'saldo_awal', header: 'Saldo Awal Bulan', render: (row) => formatRupiah(row.saldo_awal) },
    {
      key: 'masuk',
      header: 'Masuk',
      render: (row) => <span className="font-medium text-emerald-600">{formatRupiah(row.masuk)}</span>,
    },
    {
      key: 'keluar',
      header: 'Keluar',
      render: (row) => <span className="font-medium text-rose-600">{formatRupiah(row.keluar)}</span>,
    },
    {
      key: 'saldo_akhir',
      header: 'Saldo Akhir Bulan',
      render: (row) => (
        <span className={`font-semibold ${row.saldo_akhir < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
          {formatRupiah(row.saldo_akhir)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Rekap Kas Bulanan</h1>
        <p className="text-sm text-slate-500">
          Rekap saldo kas masuk &amp; keluar untuk satu bulan, per divisi dan divisi parent. Khusus Admin/Bendahara/QC.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setBulan((b) => geserBulan(b, -1))}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <input
          type="month"
          value={bulan}
          onChange={(e) => setBulan(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={() => setBulan((b) => geserBulan(b, 1))}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight size={16} />
        </button>
        <span className="text-sm font-medium capitalize text-slate-700">{labelBulan(bulan)}</span>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Saldo Awal Bulan" value={formatRupiah(total?.saldo_awal)} icon={Wallet} />
        <StatCard
          label="Total Masuk"
          value={formatRupiah(total?.masuk)}
          icon={ArrowUpCircle}
          accent="emerald"
        />
        <StatCard label="Total Keluar" value={formatRupiah(total?.keluar)} icon={ArrowDownCircle} accent="rose" />
        <StatCard label="Total Saldo Akhir Bulan" value={formatRupiah(total?.saldo_akhir)} icon={Wallet} />
      </div>

      <DataTable
        columns={columns}
        rows={data}
        emptyText={loading ? 'Memuat data...' : 'Belum ada data kas untuk bulan ini.'}
      />
    </div>
  )
}
