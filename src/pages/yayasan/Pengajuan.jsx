import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import DataTable from '../../components/DataTable'
import StatCard from '../../components/StatCard'
import PengajuanStatusBadge from '../../components/PengajuanStatusBadge'
import PengajuanFormModal from '../../components/PengajuanFormModal'
import PengajuanDetailModal from '../../components/PengajuanDetailModal'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../config/navigation'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

// Sama seperti gate `canValidasiPenerimaan` di PengajuanDetailModal - kalau
// tidak disamakan, pengajuan yang sudah butuh konfirmasi penerimaan (PO
// terkirim/dana dicairkan) tidak pernah kehitung sbg "perlu tindakan" utk
// role Divisi Yayasan. `can_konfirmasi_penerimaan` dari backend
// (PengajuanController::appendCanKonfirmasiPenerimaan) memastikan cuma yang
// benar2 berwenang (pengaju/kepala divisi/kepala parent) yang dihitung.
function butuhKonfirmasiPenerimaan(row) {
  const sudahDikirim = row.jenis_pengajuan === 'barang' ? row.pdf_terkirim_ke_suplayer : row.sudah_dicairkan

  return (
    row.can_konfirmasi_penerimaan &&
    (row.status === 'diterima_sebagian' || (row.status === 'disetujui_bendahara' && sudahDikirim))
  )
}

/**
 * Dashboard pengajuan yayasan - satu halaman yang beradaptasi per role:
 * - DIVISI YAYASAN: lihat pengajuan divisinya sendiri + turunan, bisa buat
 *   pengajuan baru & approve tahap 1 (kalau kepala divisi/parent-nya).
 * - QC (104): lihat semua pengajuan lintas divisi, approve/revisi tahap 2.
 * - BENDAHARA (102): lihat semua, approve tahap 3 (mencatat kas_transaksi).
 * - ADMIN: semua akses di atas.
 * Backend (DivisiScopeMiddleware) yang menentukan data apa yang benar-benar
 * kebaca; kartu & tombol di sini cuma penyesuaian tampilan per role.
 */
export default function PengajuanYayasan() {
  const { roleId } = useAuth()
  const numericRoleId = Number(roleId)
  const canCreate = [ROLES.ADMIN, ROLES.DIVISI_YAYASAN].includes(numericRoleId)
  const canBendahara = [ROLES.ADMIN, ROLES.BENDAHARA].includes(numericRoleId)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const [pencairanList, setPencairanList] = useState([])
  const [pencairanLoading, setPencairanLoading] = useState(false)
  const [pencairanError, setPencairanError] = useState(null)

  const [searchParams, setSearchParams] = useSearchParams()

  function openDetail(row) {
    setDetailError(null)
    api
      .get(`/yayasan/pengajuan/${row.id}`)
      .then(({ data }) => setSelected(data))
      .catch((err) => setDetailError(err.response?.data?.msg || 'Gagal memuat detail pengajuan.'))
  }

  // Dibuka lewat klik notifikasi (NotificationBell -> navigate ke
  // `?open=<id>`) - begitu terbaca, langsung buka modal review-nya &
  // bersihkan query param-nya (replace, bukan push) supaya refresh/back
  // tidak membuka ulang modal yang sama.
  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId) return

    openDetail({ id: openId })
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('open')
        return next
      },
      { replace: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = statusFilter ? { status: statusFilter } : {}
    api
      .get('/yayasan/pengajuan', { params })
      .then(({ data }) => setRows(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat data pengajuan.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const loadPencairan = useCallback(() => {
    if (!canBendahara) return
    setPencairanLoading(true)
    setPencairanError(null)
    api
      .get('/yayasan/pengajuan/pencairan-dana')
      .then(({ data }) => setPencairanList(data))
      .catch((err) => setPencairanError(err.response?.data?.msg || 'Gagal memuat daftar pencairan.'))
      .finally(() => setPencairanLoading(false))
  }, [canBendahara])

  function refreshAll() {
    loadData()
    loadPencairan()
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadPencairan()
  }, [loadPencairan])

  async function markDicairkanFromList(id) {
    setPencairanError(null)
    try {
      await api.post(`/yayasan/pengajuan/${id}/tandai-dicairkan`)
      loadPencairan()
    } catch (err) {
      setPencairanError(err.response?.data?.msg || 'Gagal menandai dicairkan.')
    }
  }

  async function downloadPencairanPdf() {
    try {
      const res = await api.get('/yayasan/pengajuan/pencairan-dana/pdf', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'daftar-pencairan-dana.pdf'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setPencairanError(err.response?.data?.msg || 'Gagal mengunduh PDF.')
    }
  }

  const counts = useMemo(() => {
    const base = {
      diajukan: 0,
      revisi_divisi: 0,
      disetujui_divisi: 0,
      revisi_qc: 0,
      disetujui_qc: 0,
      disetujui_bendahara: 0,
      diterima_sebagian: 0,
      selesai: 0,
      bermasalah: 0,
      ditolak: 0,
    }
    rows.forEach((row) => {
      if (base[row.status] !== undefined) base[row.status] += 1
    })
    return base
  }, [rows])

  // Kartu "perlu tindakan saya" disesuaikan per role: divisi lihat antrian
  // tahap 1 + yang butuh konfirmasi penerimaan, QC tahap 2, Bendahara tahap 3.
  const jumlahButuhKonfirmasiPenerimaan = useMemo(
    () => rows.filter(butuhKonfirmasiPenerimaan).length,
    [rows]
  )
  const myQueueCount =
    numericRoleId === ROLES.QC
      ? counts.disetujui_divisi
      : numericRoleId === ROLES.BENDAHARA
        ? counts.disetujui_qc
        : counts.diajukan + counts.revisi_divisi + counts.revisi_qc + jumlahButuhKonfirmasiPenerimaan

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
          <h1 className="text-xl font-semibold text-slate-900">Pengajuan Yayasan</h1>
          <p className="text-sm text-slate-500">
            Alur: Divisi/Parent Divisi → QC → Bendahara. Saldo kas baru terpotong setelah
            disetujui Bendahara.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} />
            Ajukan Pengajuan
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-9">
        <StatCard label="Perlu Tindakan Saya" value={myQueueCount} accent="amber" />
        <StatCard label="Diajukan" value={counts.diajukan} />
        <StatCard label="Revisi Divisi" value={counts.revisi_divisi} accent="amber" />
        <StatCard label="Revisi QC" value={counts.revisi_qc} accent="amber" />
        <StatCard label="Disetujui QC" value={counts.disetujui_qc} accent="indigo" />
        <StatCard label="Menunggu Konfirmasi" value={counts.disetujui_bendahara + counts.diterima_sebagian} accent="indigo" />
        <StatCard label="Selesai" value={counts.selesai} accent="emerald" />
        <StatCard label="Bermasalah" value={counts.bermasalah} accent="rose" />
        <StatCard label="Ditolak" value={counts.ditolak} accent="rose" />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Semua Status</option>
          <option value="diajukan">Diajukan</option>
          <option value="revisi_divisi">Revisi (Divisi)</option>
          <option value="disetujui_divisi">Disetujui Divisi</option>
          <option value="revisi_qc">Revisi (QC)</option>
          <option value="disetujui_qc">Disetujui QC</option>
          <option value="disetujui_bendahara">Menunggu Konfirmasi Terima</option>
          <option value="diterima_sebagian">Diterima Sebagian</option>
          <option value="selesai">Selesai</option>
          <option value="bermasalah">Bermasalah</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
      {detailError && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{detailError}</p>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        emptyText={loading ? 'Memuat data...' : 'Belum ada pengajuan.'}
      />

      {canBendahara && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Daftar Pencairan Dana</h2>
              <p className="text-xs text-slate-500">
                Pengajuan dana yang sudah disetujui Bendahara &amp; menunggu ditransfer.
              </p>
            </div>
            {pencairanList.length > 0 && (
              <button
                onClick={downloadPencairanPdf}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Download PDF
              </button>
            )}
          </div>

          {pencairanError && <p className="text-sm text-rose-600">{pencairanError}</p>}

          <DataTable
            columns={[
              { key: 'kode_pengajuan', header: 'Kode' },
              { key: 'divisi', header: 'Divisi', render: (row) => row.divisi?.nama_divisi || '-' },
              { key: 'nama_pengaju', header: 'Pengaju', render: (row) => row.nama_pengaju || '-' },
              {
                key: 'nominal',
                header: 'Nominal',
                render: (row) => formatRupiah(row.total_nilai_pengajuan),
              },
              {
                key: 'rekening',
                header: 'Rekening',
                render: (row) =>
                  row.no_rekening
                    ? `${row.nama_bank || ''} ${row.no_rekening} a.n. ${row.nama_pemilik_rekening || ''}`
                    : '-',
              },
              {
                key: 'actions',
                header: 'Aksi',
                render: (row) => (
                  <button
                    onClick={() => markDicairkanFromList(row.id)}
                    className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    Tandai Dicairkan
                  </button>
                ),
              },
            ]}
            rows={pencairanList}
            emptyText={pencairanLoading ? 'Memuat data...' : 'Tidak ada dana yang menunggu pencairan.'}
          />
        </div>
      )}

      <PengajuanFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={refreshAll} />

      <PengajuanDetailModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        pengajuan={selected}
        roleId={roleId}
        onActionDone={refreshAll}
      />
    </div>
  )
}
