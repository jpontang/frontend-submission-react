import { useEffect, useMemo, useState } from 'react'
import { FileText, Wallet, Clock, CircleX, Landmark } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/StatCard'
import InfoStatCard from '../../components/InfoStatCard'
import RevenueChart from '../../components/RevenueChart'
import DataTable from '../../components/DataTable'
import PengajuanStatusBadge from '../../components/PengajuanStatusBadge'
import SppUnitDetailModal from '../../components/SppUnitDetailModal'
import { useApp } from '../../context/AppContext'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0)
}

const STATUS_ORDER = [
  'diajukan',
  'revisi_divisi',
  'disetujui_divisi',
  'revisi_qc',
  'disetujui_qc',
  'disetujui_bendahara',
  'diterima_sebagian',
  'selesai',
  'bermasalah',
  'ditolak',
]

const STATUS_LABELS = {
  diajukan: 'Diajukan',
  revisi_divisi: 'Revisi Divisi',
  disetujui_divisi: 'Disetujui Divisi',
  revisi_qc: 'Revisi QC',
  disetujui_qc: 'Disetujui QC',
  disetujui_bendahara: 'Menunggu Konfirmasi',
  diterima_sebagian: 'Diterima Sebagian',
  selesai: 'Selesai',
  bermasalah: 'Bermasalah',
  ditolak: 'Ditolak',
}

// Warna disamakan dgn PengajuanStatusBadge (amber/blue/orange/cyan/violet/emerald/rose).
const STATUS_COLORS = {
  diajukan: '#f59e0b',
  revisi_divisi: '#f97316',
  disetujui_divisi: '#3b82f6',
  revisi_qc: '#f97316',
  disetujui_qc: '#06b6d4',
  disetujui_bendahara: '#8b5cf6',
  diterima_sebagian: '#f59e0b',
  selesai: '#10b981',
  bermasalah: '#f43f5e',
  ditolak: '#f43f5e',
}

// "Selesai" (final, sudah dikonfirmasi diterima lengkap - lihat
// Pengajuan::canValidasiPenerimaan()) TIDAK termasuk pending. Sisanya masih
// butuh tindak lanjut dari suatu pihak, termasuk disetujui_bendahara/
// diterima_sebagian (masih menunggu konfirmasi pengaju) & bermasalah (perlu
// follow-up Bendahara/Admin).
const PENDING_STATUSES = [
  'diajukan',
  'revisi_divisi',
  'disetujui_divisi',
  'disetujui_qc',
  'revisi_qc',
  'disetujui_bendahara',
  'diterima_sebagian',
  'bermasalah',
]

const BULAN_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// Nilai yang saldo kasnya sudah benar2 terpotong (lihat Pengajuan::approveBendahara())
// - tetap dihitung "selesai" secara finansial dari tahap disetujui_bendahara
// ke atas, TERLEPAS dari status konfirmasi penerimaan pengaju (yang cuma
// menambah info susulan, tidak membatalkan transaksi kas yang sudah jalan).
const STATUS_SUDAH_CAIR = ['disetujui_bendahara', 'diterima_sebagian', 'selesai', 'bermasalah']

/**
 * Dashboard Admin - ringkasan & grafik kegiatan Pengajuan Yayasan (real
 * data dari GET /yayasan/pengajuan, admin lihat lintas semua divisi lewat
 * DivisiScopeMiddleware). Sebelumnya seluruh halaman ini dummy/hardcode.
 */
export default function AdminDashboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    periode,
    sppMasuk,
    sppFull,
    sppUnitMasuk,
    sppUnitAll,
    totalDaftarUlang,
    loading: sppLoading,
    fetchPeriode,
    fetchAllSppMasuk,
    fetchAllSppFull,
    fetchSppUnitMasuk,
    fetchSppUnitAll,
    fetchTotalPmbDaful,
  } = useApp()
  const [showSppDetail, setShowSppDetail] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get('/yayasan/pengajuan')
      .then(({ data }) => setRows(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat data pengajuan.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchPeriode()
    fetchAllSppMasuk()
    fetchAllSppFull()
    fetchSppUnitMasuk()
    fetchSppUnitAll()
    fetchTotalPmbDaful()
  }, [fetchPeriode, fetchAllSppMasuk, fetchAllSppFull, fetchSppUnitMasuk, fetchSppUnitAll, fetchTotalPmbDaful])

  // getTotalPmbDaful() balikin array (di-group by kode_jenis_biaya, tapi query-nya
  // sudah difilter ke nomor_pembayaran diawali '3' = Daftar Ulang/DPP), jadi
  // praktisnya cuma 1 baris. nama_jenis_biaya dipakai sbg label kalau ada,
  // supaya labelnya ikut nama asli di tabel jenis_biaya (bukan di-hardcode).
  const daftarUlang = totalDaftarUlang?.[0]
  const totalDaftarUlangValue = Number(daftarUlang?.total_daful || 0)

  const periodeAktif = periode?.[0]?.nama_periode || '2026/2027'
  const bulanIni = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    []
  )
  const persenSppMasuk = sppFull ? Number(((sppMasuk / sppFull) * 100).toFixed(2)) : 0

  const sppDetailRows = useMemo(() => {
    return (sppUnitAll || []).map((unit) => {
      const masukUnit = (sppUnitMasuk || []).find((u) => u.nama_unit === unit.nama_unit)
      const masuk = Number(masukUnit?.total || 0)
      const total = Number(unit.total || 0)
      const percentage = total > 0 ? Number(((masuk / total) * 100).toFixed(2)) : 0
      return { unit: unit.nama_unit, masuk, total, percentage }
    })
  }, [sppUnitAll, sppUnitMasuk])

  const stats = useMemo(() => {
    const totalNilaiSelesai = rows
      .filter((r) => STATUS_SUDAH_CAIR.includes(r.status))
      .reduce((sum, r) => sum + (Number(r.total_nilai_pengajuan) || 0), 0)

    return {
      total: rows.length,
      totalNilaiSelesai,
      menungguProses: rows.filter((r) => PENDING_STATUSES.includes(r.status)).length,
      ditolak: rows.filter((r) => r.status === 'ditolak').length,
    }
  }, [rows])

  // 6 bulan terakhir (termasuk bulan berjalan), dihitung dari created_at.
  const chartData = useMemo(() => {
    const now = new Date()
    const bulanBuckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: BULAN_LABEL[d.getMonth()], value: 0 }
    })

    rows.forEach((row) => {
      if (!row.created_at) return
      const d = new Date(row.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = bulanBuckets.find((b) => b.key === key)
      if (bucket) bucket.value += 1
    })

    return bulanBuckets.map(({ label, value }) => ({ label, value }))
  }, [rows])

  const statusPieData = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      name: STATUS_LABELS[status],
      value: rows.filter((r) => r.status === status).length,
      color: STATUS_COLORS[status],
    })).filter((d) => d.value > 0)
  }, [rows])

  const recent = rows.slice(0, 8)

  const columns = [
    { key: 'kode_pengajuan', header: 'Kode' },
    { key: 'divisi', header: 'Divisi', render: (row) => row.divisi?.nama_divisi || '-' },
    {
      key: 'jenis_pengajuan',
      header: 'Jenis',
      render: (row) => (row.jenis_pengajuan === 'barang' ? 'Pengadaan Barang' : 'Pengajuan Dana'),
    },
    {
      key: 'total_nilai_pengajuan',
      header: 'Nilai',
      render: (row) => formatRupiah(row.total_nilai_pengajuan),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <PengajuanStatusBadge
          status={row.status}
          jenisPengajuan={row.jenis_pengajuan}
          pdfTerkirim={row.pdf_terkirim_ke_suplayer}
          sudahDicairkan={row.sudah_dicairkan}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan &amp; grafik kegiatan Pengajuan Yayasan.</p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pengajuan" value={stats.total} icon={FileText} accent="indigo" />
        <StatCard
          label="Total Nilai Selesai"
          value={formatRupiah(stats.totalNilaiSelesai)}
          icon={Wallet}
          accent="emerald"
        />
        <StatCard label="Menunggu Proses" value={stats.menungguProses} icon={Clock} accent="amber" />
        <StatCard label="Ditolak" value={stats.ditolak} icon={CircleX} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
        <InfoStatCard
          title="Total SPP Masuk"
          period={periodeAktif}
          value={sppLoading.sppMasuk ? '...' : formatRupiah(sppMasuk)}
          percentage={persenSppMasuk}
          onDetailClick={() => setShowSppDetail(true)}
        />
        <StatCard
          label={daftarUlang?.nama_jenis_biaya || 'Biaya Daftar Ulang (DPP)'}
          value={sppLoading.totalDaftarUlang ? '...' : formatRupiah(totalDaftarUlangValue)}
          icon={Landmark}
          accent="indigo"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} title="Pengajuan per Bulan" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Status Pengajuan</h3>
          {statusPieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {loading ? 'Memuat data...' : 'Belum ada pengajuan.'}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {statusPieData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Pengajuan Terbaru</h3>
        <DataTable
          columns={columns}
          rows={recent}
          emptyText={loading ? 'Memuat data...' : 'Belum ada pengajuan.'}
        />
      </div>

      <SppUnitDetailModal
        open={showSppDetail}
        onClose={() => setShowSppDetail(false)}
        periodLabel={bulanIni}
        rows={sppDetailRows}
      />
    </div>
  )
}
