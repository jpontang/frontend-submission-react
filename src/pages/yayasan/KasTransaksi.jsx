import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Plus, Wallet } from 'lucide-react'
import DataTable from '../../components/DataTable'
import StatCard from '../../components/StatCard'
import AlokasiBudgetModal from '../../components/AlokasiBudgetModal'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { ROLES } from '../../config/navigation'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const JENIS_LABELS = {
  pemasukan: 'Pemasukan',
  pengajuan_dana: 'Pengajuan Dana',
  pengadaan_barang: 'Pengadaan Barang',
  pengeluaran: 'Pengeluaran',
  distribusi_unit: 'Distribusi ke Unit',
}

const STATUS_STYLES = {
  diajukan: 'bg-amber-50 text-amber-700',
  disetujui: 'bg-emerald-50 text-emerald-700',
  ditolak: 'bg-rose-50 text-rose-700',
  selesai: 'bg-slate-100 text-slate-600',
}

/**
 * Riwayat kas transaksi (pemasukan/pengajuan_dana/pengadaan_barang) per
 * divisi. Bendahara & admin bisa pilih divisi atau parent divisi manapun
 * lewat dropdown (backend GET /yayasan/kas-transaksi tidak dibatasi utk
 * role ini - lihat DivisiScopeMiddleware::CROSS_DIVISI_ROLE_IDS). Role
 * DIVISI YAYASAN otomatis dibatasi backend ke divisinya sendiri + turunan
 * saja (DivisiScopeMiddleware), makanya dropdown-nya disembunyikan - tidak
 * ada divisi lain yang bisa dia lihat walau dropdown ditampilkan.
 */
export default function KasTransaksi() {
  const { roleId } = useAuth()
  const { sppUnitAll, fetchSppUnitAll } = useApp()
  const canPickDivisi = [ROLES.ADMIN, ROLES.BENDAHARA].includes(Number(roleId))
  const canAlokasi = Number(roleId) === ROLES.ADMIN

  const [transaksi, setTransaksi] = useState([])
  const [divisiList, setDivisiList] = useState([])
  const [deductionIncomeList, setDeductionIncomeList] = useState([])
  const [selectedDivisi, setSelectedDivisi] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAlokasi, setShowAlokasi] = useState(false)

  function loadDivisi() {
    if (!canPickDivisi) return
    api
      .get('/yayasan/divisi')
      .then(({ data }) => setDivisiList(data))
      .catch(() => {})
  }

  function loadDeductionIncome() {
    if (!canAlokasi) return
    const now = new Date()
    const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    api
      .get('/yayasan/deduction-income', { params: { periode } })
      .then(({ data }) => setDeductionIncomeList(data))
      .catch(() => {})
  }

  function loadTransaksi() {
    setLoading(true)
    setError(null)
    const params = selectedDivisi ? { divisi_id: selectedDivisi } : {}
    api
      .get('/yayasan/kas-transaksi', { params })
      .then(({ data }) => setTransaksi(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat data kas transaksi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDivisi()
    if (canAlokasi) {
      fetchSppUnitAll()
      loadDeductionIncome()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPickDivisi, canAlokasi])

  useEffect(() => {
    loadTransaksi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivisi])

  // Baris pertama tiap divisi_id = saldo terbaru (backend urutkan DESC by id).
  const saldoPerDivisi = useMemo(() => {
    const map = new Map()
    transaksi.forEach((t) => {
      if (!map.has(t.divisi_id)) map.set(t.divisi_id, t)
    })
    return map
  }, [transaksi])

  const columns = [
    { key: 'kode_transaksi', header: 'Kode' },
    { key: 'divisi', header: 'Divisi', render: (row) => row.divisi?.nama_divisi || '-' },
    {
      key: 'jenis_transaksi',
      header: 'Jenis',
      render: (row) => JENIS_LABELS[row.jenis_transaksi] || row.jenis_transaksi,
    },
    {
      key: 'arah',
      header: 'Arah',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            row.arah === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {row.arah === 'masuk' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
          {row.arah === 'masuk' ? 'Masuk' : 'Keluar'}
        </span>
      ),
    },
    { key: 'uraian', header: 'Uraian' },
    { key: 'nominal', header: 'Nominal', render: (row) => formatRupiah(row.nominal) },
    {
      key: 'saldo_sesudah',
      header: 'Saldo Berjalan',
      render: (row) => formatRupiah(row.saldo_sesudah),
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
      key: 'tanggal_transaksi',
      header: 'Tanggal',
      render: (row) =>
        row.tanggal_transaksi ? new Date(row.tanggal_transaksi).toLocaleDateString('id-ID') : '-',
    },
  ]

  const selectedDivisiNama = divisiList.find((d) => String(d.id) === String(selectedDivisi))?.nama_divisi

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kas Transaksi</h1>
          <p className="text-sm text-slate-500">
            {canPickDivisi
              ? 'Arus kas seluruh divisi & parent divisi.'
              : 'Arus kas divisi Anda.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canAlokasi && (
            <button
              onClick={() => setShowAlokasi(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Plus size={16} />
              Alokasikan Budget
            </button>
          )}

          {canPickDivisi && (
            <select
              value={selectedDivisi}
              onChange={(e) => setSelectedDivisi(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Divisi</option>
              {divisiList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.parent_divisi_id ? `— ${d.nama_divisi}` : d.nama_divisi}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
      )}

      {canPickDivisi && selectedDivisi ? (
        <StatCard
          label={`Saldo Saat Ini${selectedDivisiNama ? ` - ${selectedDivisiNama}` : ''}`}
          value={formatRupiah(saldoPerDivisi.get(Number(selectedDivisi))?.saldo_sesudah ?? 0)}
          icon={Wallet}
        />
      ) : !canPickDivisi ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(saldoPerDivisi.values()).map((t) => (
            <StatCard
              key={t.divisi_id}
              label={`Saldo Saat Ini - ${t.divisi?.nama_divisi || ''}`}
              value={formatRupiah(t.saldo_sesudah)}
              icon={Wallet}
            />
          ))}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={transaksi}
        emptyText={loading ? 'Memuat data...' : 'Belum ada transaksi.'}
      />

      {canAlokasi && (
        <AlokasiBudgetModal
          open={showAlokasi}
          onClose={() => setShowAlokasi(false)}
          divisiList={divisiList}
          sppUnitAll={sppUnitAll || []}
          deductionIncomeList={deductionIncomeList}
          onSaved={loadTransaksi}
        />
      )}
    </div>
  )
}
