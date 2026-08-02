import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import DataTable from '../../components/DataTable'
import StatCard from '../../components/StatCard'
import PengajuanStatusBadge from '../../components/PengajuanStatusBadge'
import PeminjamanFormModal from '../../components/PeminjamanFormModal'
import PeminjamanDetailModal from '../../components/PeminjamanDetailModal'
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

const PENGEMBALIAN_LABELS = {
  belum_lunas: 'Belum Lunas',
  sebagian: 'Sebagian',
  lunas: 'Lunas',
}

const PENGEMBALIAN_STYLES = {
  belum_lunas: 'bg-amber-50 text-amber-700',
  sebagian: 'bg-blue-50 text-blue-700',
  lunas: 'bg-emerald-50 text-emerald-700',
}

/**
 * Peminjaman antar-divisi - roles & alur sama persis Pengajuan (Divisi/
 * Parent -> QC -> Bendahara), lihat pages/yayasan/Pengajuan.jsx sbg pola
 * pembandingnya. Bedanya, peminjaman punya divisi PEMBERI (sumber dana)
 * selain divisi peminjam, dan setelah disetujui Bendahara masih ada tahap
 * "pengembalian" (cicilan) yang dilacak sampai lunas.
 */
export default function Peminjaman() {
  const { roleId } = useAuth()
  const numericRoleId = Number(roleId)
  const canCreate = [ROLES.ADMIN, ROLES.DIVISI_YAYASAN].includes(numericRoleId)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = statusFilter ? { status: statusFilter } : {}
    api
      .get('/yayasan/peminjaman', { params })
      .then(({ data }) => setRows(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat data peminjaman.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openDetail(row) {
    setDetailError(null)
    api
      .get(`/yayasan/peminjaman/${row.id}`)
      .then(({ data }) => setSelected(data))
      .catch((err) => setDetailError(err.response?.data?.msg || 'Gagal memuat detail peminjaman.'))
  }

  const counts = useMemo(() => {
    const base = {
      diajukan: 0,
      disetujui_divisi: 0,
      revisi_qc: 0,
      disetujui_qc: 0,
      disetujui_bendahara: 0,
      ditolak: 0,
      belumLunas: 0,
    }
    rows.forEach((row) => {
      if (base[row.status] !== undefined) base[row.status] += 1
      if (row.status === 'disetujui_bendahara' && row.status_pengembalian !== 'lunas') base.belumLunas += 1
    })
    return base
  }, [rows])

  const myQueueCount =
    numericRoleId === ROLES.QC
      ? counts.disetujui_divisi
      : numericRoleId === ROLES.BENDAHARA
        ? counts.disetujui_qc
        : counts.diajukan + counts.revisi_qc

  const columns = [
    { key: 'kode_peminjaman', header: 'Kode' },
    { key: 'divisi', header: 'Peminjam', render: (row) => row.divisi?.nama_divisi || '-' },
    { key: 'divisi_pemberi', header: 'Pemberi', render: (row) => row.divisi_pemberi?.nama_divisi || '-' },
    { key: 'nominal', header: 'Nominal', render: (row) => formatRupiah(row.nominal) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <PengajuanStatusBadge status={row.status} />,
    },
    {
      key: 'status_pengembalian',
      header: 'Pengembalian',
      render: (row) =>
        row.status === 'disetujui_bendahara' ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              PENGEMBALIAN_STYLES[row.status_pengembalian] || 'bg-slate-100 text-slate-600'
            }`}
          >
            {PENGEMBALIAN_LABELS[row.status_pengembalian] || row.status_pengembalian}
          </span>
        ) : (
          '-'
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
          <h1 className="text-xl font-semibold text-slate-900">Peminjaman</h1>
          <p className="text-sm text-slate-500">
            Peminjaman antar-divisi. Alur: Divisi/Parent Peminjam → QC → Bendahara.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} />
            Ajukan Peminjaman
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Perlu Tindakan Saya" value={myQueueCount} accent="amber" />
        <StatCard label="Diajukan" value={counts.diajukan} />
        <StatCard label="Revisi QC" value={counts.revisi_qc} accent="amber" />
        <StatCard label="Disetujui QC" value={counts.disetujui_qc} accent="indigo" />
        <StatCard label="Belum Lunas" value={counts.belumLunas} accent="amber" />
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
          <option value="disetujui_divisi">Disetujui Divisi</option>
          <option value="revisi_qc">Revisi (QC)</option>
          <option value="disetujui_qc">Disetujui QC</option>
          <option value="disetujui_bendahara">Disetujui Bendahara</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
      {detailError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{detailError}</p>}

      <DataTable
        columns={columns}
        rows={rows}
        emptyText={loading ? 'Memuat data...' : 'Belum ada peminjaman.'}
      />

      <PeminjamanFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={loadData} />

      <PeminjamanDetailModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        peminjaman={selected}
        roleId={roleId}
        onActionDone={loadData}
      />
    </div>
  )
}
