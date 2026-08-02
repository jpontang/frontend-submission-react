import { useCallback, useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'
import PengajuanStatusBadge from '../components/PengajuanStatusBadge'
import PengajuanDetailModal from '../components/PengajuanDetailModal'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

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

/**
 * Antrian pengajuan Yayasan yang BELUM ditindaklanjuti Bendahara -
 * status=disetujui_qc (sudah lolos divisi & QC, menunggu tahap 3/Bendahara
 * sebelum saldo kas benar-benar terpotong). Menu khusus Bendahara, terpisah
 * dari menu "Pengajuan" umum - sama polanya dgn QC Review utk tahap QC.
 * Difilter langsung di backend (GET /yayasan/pengajuan?status=disetujui_qc).
 * Aksi ACC/Tolak dipakai dari PengajuanDetailModal yang sama dgn menu
 * Pengajuan, supaya tidak duplikasi logic approve-bendahara.
 */
export default function BendaharaReview() {
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
      .get('/yayasan/pengajuan', { params: { status: 'disetujui_qc' } })
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

  const columns = [
    { key: 'kode_pengajuan', header: 'Kode' },
    { key: 'divisi', header: 'Divisi', render: (row) => row.divisi?.nama_divisi || '-' },
    {
      key: 'jenis_pengajuan',
      header: 'Jenis',
      render: (row) => (row.jenis_pengajuan === 'barang' ? 'Pengadaan Barang' : 'Pengajuan Dana'),
    },
    { key: 'nama_kegiatan', header: 'Kegiatan', render: (row) => row.nama_kegiatan || '-' },
    {
      key: 'total_nilai_pengajuan',
      header: 'Nilai',
      render: (row) => formatRupiah(row.total_nilai_pengajuan),
    },
    {
      key: 'tanggal_disetujui_qc',
      header: 'Disetujui QC',
      render: (row) => formatTanggal(row.tanggal_disetujui_qc),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <PengajuanStatusBadge status={row.status} />,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Approval Bendahara</h1>
          <p className="text-sm text-slate-500">
            Pengajuan yang sudah disetujui QC &amp; menunggu ACC Bendahara (saldo kas terpotong
            setelah tahap ini).
          </p>
        </div>
      </div>

      <StatCard label="Menunggu ACC Bendahara" value={rows.length} accent="amber" />

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
      {detailError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{detailError}</p>}

      <DataTable
        columns={columns}
        rows={rows}
        emptyText={loading ? 'Memuat data...' : 'Tidak ada pengajuan yang menunggu ACC Bendahara.'}
      />

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
