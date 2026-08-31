import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Eye, Landmark, Plus } from 'lucide-react'
import DataTable from '../../components/DataTable'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import PengeluaranKasYayasanModal from '../../components/PengeluaranKasYayasanModal'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

const STATUS_STYLES = {
  diajukan: 'bg-amber-50 text-amber-700',
  disetujui: 'bg-emerald-50 text-emerald-700',
  ditolak: 'bg-rose-50 text-rose-700',
  selesai: 'bg-slate-100 text-slate-600',
}

/**
 * Kas Transaksi khusus Yayasan (kode_divisi=YAYASAN, lihat migration
 * seed_divisi_yayasan) - ledger terpisah dari kas per-unit, isinya agregat
 * total pembayaran SPP semua unit sekolah per hari (dicatat otomatis oleh
 * cron yayasan:tambah-saldo-harian-yayasan). Khusus Admin.
 */
export default function KasTransaksiYayasan() {
  const [divisiYayasanId, setDivisiYayasanId] = useState(null)
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showPengeluaran, setShowPengeluaran] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const { data: divisiList } = await api.get('/yayasan/divisi')
      const divisiYayasan = divisiList.find((d) => d.kode_divisi === 'YAYASAN')

      if (!divisiYayasan) {
        setError('Divisi Yayasan (kode_divisi=YAYASAN) belum ada. Jalankan migration seed_divisi_yayasan.')
        setTransaksi([])
        return
      }

      setDivisiYayasanId(divisiYayasan.id)
      const { data } = await api.get('/yayasan/kas-transaksi', { params: { divisi_id: divisiYayasan.id } })
      setTransaksi(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat kas transaksi Yayasan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openDetail(row) {
    setDetailLoading(true)
    setDetail({ ...row, detil: [] })
    api
      .get(`/yayasan/kas-transaksi/${row.id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }

  const saldoSaatIni = transaksi[0]?.saldo_sesudah ?? 0

  const columns = [
    { key: 'kode_transaksi', header: 'Kode' },
    { key: 'uraian', header: 'Uraian' },
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
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => openDetail(row)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Eye size={14} />
          Rincian
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Kas Transaksi Yayasan</h1>
          <p className="text-sm text-slate-500">
            Agregat total pembayaran SPP seluruh unit sekolah per hari - terpisah dari kas masing-masing
            unit. Khusus Admin.
          </p>
        </div>

        <button
          onClick={() => setShowPengeluaran(true)}
          disabled={!divisiYayasanId}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
        >
          <Plus size={16} />
          Tambah Pengeluaran
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <StatCard label="Saldo Kas Yayasan Saat Ini" value={formatRupiah(saldoSaatIni)} icon={Landmark} />

      <DataTable
        columns={columns}
        rows={transaksi}
        emptyText={loading ? 'Memuat data...' : 'Belum ada transaksi kas Yayasan.'}
      />

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Rincian - ${detail?.kode_transaksi ?? ''}`}
        size="lg"
      >
        {detailLoading ? (
          <p className="text-sm text-slate-500">Memuat rincian...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Uraian</span>
                <p className="font-medium text-slate-800">{detail?.uraian}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Nominal</span>
                <p className="font-medium text-slate-800">{formatRupiah(detail?.nominal)}</p>
              </div>
            </div>

            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Unit</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(detail?.detil ?? []).map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 text-slate-700">{d.uraian}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatRupiah(d.total)}</td>
                  </tr>
                ))}
                {(detail?.detil ?? []).length === 0 && !detailLoading && (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-center text-slate-400">
                      Tidak ada rincian per unit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <PengeluaranKasYayasanModal
        open={showPengeluaran}
        onClose={() => setShowPengeluaran(false)}
        divisiId={divisiYayasanId}
        saldoSaatIni={saldoSaatIni}
        onSaved={loadData}
      />
    </div>
  )
}
