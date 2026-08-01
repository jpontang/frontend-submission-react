import { useEffect, useState } from 'react'
import { Eye, Landmark } from 'lucide-react'
import DataTable from '../../components/DataTable'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
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
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

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
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Kas Transaksi Yayasan</h1>
        <p className="text-sm text-slate-500">
          Agregat total pembayaran SPP seluruh unit sekolah per hari - terpisah dari kas masing-masing
          unit. Khusus Admin.
        </p>
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
    </div>
  )
}
