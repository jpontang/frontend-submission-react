import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, ClipboardX, ClipboardList } from 'lucide-react'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import PengajuanStatusBadge from '../../components/PengajuanStatusBadge'
import PengajuanDetailModal from '../../components/PengajuanDetailModal'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatTanggal(value) {
  return value ? new Date(value).toLocaleDateString('id-ID') : '-'
}

function isBulanIni(value) {
  if (!value) return false
  const d = new Date(value)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

/**
 * Dashboard QC: ringkasan antrean review + statistik ACC/tolak bulan ini,
 * dari data pengajuan sungguhan (GET /yayasan/pengajuan, role QC/admin lihat
 * semua tanpa scope divisi - lihat DivisiScopeMiddleware). Sebelumnya
 * halaman ini pakai data dummy hardcoded, sekarang disamakan dgn pola
 * QCReview.jsx & DivisiYayasanDashboard.jsx yang sudah pakai data asli.
 */
export default function QCDashboard() {
  const { roleId } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detailError, setDetailError] = useState(null)

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/yayasan/pengajuan')
      .then(({ data }) => setRows(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat data pengajuan.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openDetail(row) {
    setDetailError(null)
    api
      .get(`/yayasan/pengajuan/${row.id}`)
      .then(({ data }) => setSelected(data))
      .catch((err) => setDetailError(err.response?.data?.msg || 'Gagal memuat detail pengajuan.'))
  }

  // Antrean = status disetujui_divisi (sudah lolos tahap 1, menunggu ACC QC).
  const antrean = useMemo(() => rows.filter((row) => row.status === 'disetujui_divisi'), [rows])

  const counts = useMemo(() => {
    let disetujuiBulanIni = 0
    let ditolakBulanIni = 0
    rows.forEach((row) => {
      // tanggal_disetujui_qc kepasang begitu QC ACC, tetap ada walau
      // pengajuannya sudah lanjut ke tahap disetujui_qc/disetujui_bendahara.
      if (row.tanggal_disetujui_qc && isBulanIni(row.tanggal_disetujui_qc)) disetujuiBulanIni += 1
      if (row.status === 'ditolak' && row.ditolak_pada_tahap === 'qc' && isBulanIni(row.tanggal_ditolak)) {
        ditolakBulanIni += 1
      }
    })
    return { disetujuiBulanIni, ditolakBulanIni }
  }, [rows])

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
      key: 'tanggal_disetujui_divisi',
      header: 'Disetujui Divisi',
      render: (row) => formatTanggal(row.tanggal_disetujui_divisi),
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
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => openDetail(row)}
          className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          Review
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard QC</h1>
        <p className="text-sm text-slate-500">Ringkasan antrean review pengajuan Yayasan.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Review" value={antrean.length} icon={ClipboardList} accent="amber" />
        <StatCard label="Disetujui Bulan Ini" value={counts.disetujuiBulanIni} icon={ClipboardCheck} accent="emerald" />
        <StatCard label="Ditolak Bulan Ini" value={counts.ditolakBulanIni} icon={ClipboardX} accent="rose" />
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
      {detailError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{detailError}</p>}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Antrean Review</h3>
        <DataTable
          columns={columns}
          rows={antrean}
          emptyText={loading ? 'Memuat data...' : 'Tidak ada pengajuan yang menunggu review QC.'}
        />
      </div>

      <PengajuanDetailModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        pengajuan={selected}
        roleId={roleId}
        onActionDone={loadData}
      />
    </div>
  )
}
