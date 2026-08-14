import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, FileText, Clock, CircleCheck, CircleX, Wallet, Percent } from 'lucide-react'
import StatCard from '../../components/StatCard'
import InfoStatCard from '../../components/InfoStatCard'
import DataTable from '../../components/DataTable'
import PengajuanStatusBadge from '../../components/PengajuanStatusBadge'
import PengajuanFormModal from '../../components/PengajuanFormModal'
import PengajuanDetailModal from '../../components/PengajuanDetailModal'
import SppUnitDetailModal from '../../components/SppUnitDetailModal'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

// Status yang butuh tindakan Kepala Divisi: baru diajukan (tahap 1),
// dikembalikan sendiri utk direvisi, atau dikembalikan QC utk direvisi lalu
// disubmit ulang.
const STATUS_PERLU_TINDAKAN = ['diajukan', 'revisi_divisi', 'revisi_qc']

/**
 * Dashboard Kepala Divisi (role DIVISI YAYASAN) - ringkasan pengajuan
 * divisinya sendiri + turunan (dibatasi backend lewat DivisiScopeMiddleware,
 * jadi GET /yayasan/pengajuan di sini otomatis cuma balikin punya scope-nya
 * tanpa perlu filter tambahan di frontend).
 */
export default function DivisiYayasanDashboard() {
  const { roleId } = useAuth()
  const { periode, sppUnitMasuk, sppUnitAll, loading: sppLoading, fetchPeriode, fetchSppUnitMasuk, fetchSppUnitAll } =
    useApp()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [divisiList, setDivisiList] = useState([])
  const [saldoMap, setSaldoMap] = useState(new Map())
  const [saldoLoading, setSaldoLoading] = useState(true)
  const [saldoError, setSaldoError] = useState(null)
  const [showSppDetail, setShowSppDetail] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/yayasan/pengajuan')
      .then(({ data }) => setRows(data))
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat data pengajuan.'))
      .finally(() => setLoading(false))
  }, [])

  // Saldo kas berjalan divisi Anda + seluruh turunannya. /yayasan/divisi
  // sudah otomatis dipersempit ke scope role DIVISI YAYASAN lewat
  // DivisiScopeMiddleware. /yayasan/divisi-saldo sendiri tidak scoped
  // (dipakai jg oleh modal Ajukan Peminjaman lintas divisi), tapi yang
  // ditampilkan di sini cuma yang ada di divisiList (sudah scoped), jadi
  // tidak bocor ke divisi luar jangkauan Anda. Dibangun dari endpoint
  // saldo terkini ini (bukan dari riwayat kas-transaksi) supaya divisi yang
  // belum pernah ada transaksi sama sekali tetap muncul dgn saldo 0.
  const loadSaldo = useCallback(() => {
    setSaldoLoading(true)
    setSaldoError(null)
    Promise.all([api.get('/yayasan/divisi'), api.get('/yayasan/divisi-saldo')])
      .then(([divisiRes, saldoRes]) => {
        setDivisiList(divisiRes.data)
        setSaldoMap(new Map(saldoRes.data.map((d) => [d.id, d.saldo])))
      })
      .catch((err) => setSaldoError(err.response?.data?.msg || 'Gagal memuat saldo kas divisi.'))
      .finally(() => setSaldoLoading(false))
  }, [])

  useEffect(() => {
    loadData()
    loadSaldo()
    fetchPeriode()
    fetchSppUnitMasuk()
    fetchSppUnitAll()
  }, [loadData, loadSaldo, fetchPeriode, fetchSppUnitMasuk, fetchSppUnitAll])

  const saldoRows = useMemo(
    () => divisiList.map((d) => ({ ...d, saldo: saldoMap.get(d.id) ?? 0 })),
    [divisiList, saldoMap]
  )

  const totalSaldo = useMemo(() => saldoRows.reduce((sum, d) => sum + d.saldo, 0), [saldoRows])

  const periodeAktif = periode?.[0]?.nama_periode || '2026/2027'

  // Divisi Anda + turunan bisa mewakili lebih dari satu unit sekolah SIAK
  // (mis. Kepala Direktorat Pendidikan menaungi PG s/d SDIT 2), atau cuma
  // satu (Kepala Unit spesifik) - tbl_divisi.kode_unit_siak (nullable,
  // cuma diisi utk divisi yang setara unit sekolah) menghubungkannya ke
  // kode_unit di sppUnitMasuk/sppUnitAll. Persentase dihitung dari
  // gabungan unit-unit dalam scope ini saja, BUKAN dari total SPP seluruh
  // yayasan seperti di Dashboard Bendahara.
  const unitKodeSet = useMemo(
    () =>
      new Set(
        divisiList
          .map((d) => d.kode_unit_siak)
          .filter((k) => k !== null && k !== undefined)
          .map(Number)
      ),
    [divisiList]
  )

  const sppDetailRows = useMemo(() => {
    return (sppUnitAll || [])
      .filter((unit) => unitKodeSet.has(Number(unit.kode_unit)))
      .map((unit) => {
        const masukUnit = (sppUnitMasuk || []).find((u) => u.nama_unit === unit.nama_unit)
        const masuk = Number(masukUnit?.total || 0)
        const total = Number(unit.total || 0)
        const percentage = total > 0 ? Number(((masuk / total) * 100).toFixed(2)) : 0
        return { unit: unit.nama_unit, masuk, total, percentage }
      })
  }, [sppUnitAll, sppUnitMasuk, unitKodeSet])

  const persenSppMasukUnit = useMemo(() => {
    const totalUnit = sppDetailRows.reduce((sum, r) => sum + r.total, 0)
    const masukUnit = sppDetailRows.reduce((sum, r) => sum + r.masuk, 0)
    return totalUnit > 0 ? Number(((masukUnit / totalUnit) * 100).toFixed(2)) : 0
  }, [sppDetailRows])

  function openDetail(row) {
    setDetailError(null)
    api
      .get(`/yayasan/pengajuan/${row.id}`)
      .then(({ data }) => setSelected(data))
      .catch((err) => setDetailError(err.response?.data?.msg || 'Gagal memuat detail pengajuan.'))
  }

  const counts = useMemo(() => {
    const now = new Date()
    const base = { perluTindakan: 0, dalamProses: 0, selesaiBulanIni: 0, ditolak: 0 }
    rows.forEach((row) => {
      if (STATUS_PERLU_TINDAKAN.includes(row.status)) base.perluTindakan += 1
      else if (['disetujui_divisi', 'disetujui_qc'].includes(row.status)) base.dalamProses += 1
      else if (row.status === 'ditolak') base.ditolak += 1

      if (row.status === 'disetujui_bendahara' && row.tanggal_disetujui_bendahara) {
        const d = new Date(row.tanggal_disetujui_bendahara)
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          base.selesaiBulanIni += 1
        }
      }
    })
    return base
  }, [rows])

  const perluTindakan = useMemo(
    () => rows.filter((row) => STATUS_PERLU_TINDAKAN.includes(row.status)),
    [rows]
  )

  const terbaru = useMemo(() => rows.slice(0, 8), [rows])

  const kolomSaldo = [
    {
      key: 'nama_divisi',
      header: 'Divisi',
      render: (row) => (
        <span className={row.parent_divisi_id ? 'pl-4 text-slate-700' : 'font-semibold text-slate-900'}>
          {row.parent_divisi_id ? `— ${row.nama_divisi}` : row.nama_divisi}
        </span>
      ),
    },
    { key: 'parent', header: 'Induk Divisi', render: (row) => row.parent?.nama_divisi || '-' },
    {
      key: 'saldo',
      header: 'Saldo Berjalan',
      render: (row) => (
        <span className={`font-medium ${row.saldo < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
          {formatRupiah(row.saldo)}
        </span>
      ),
    },
  ]

  const kolomAksi = {
    key: 'actions',
    header: 'Aksi',
    render: (row) => (
      <button
        onClick={() => openDetail(row)}
        className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
      >
        {STATUS_PERLU_TINDAKAN.includes(row.status) ? 'Tindak Lanjut' : 'Detail'}
      </button>
    ),
  }

  const kolomDasar = [
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
    { key: 'status', header: 'Status', render: (row) => <PengajuanStatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard Kepala Divisi</h1>
          <p className="text-sm text-slate-500">Ringkasan pengajuan divisi Anda &amp; turunannya.</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Ajukan Pengajuan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Perlu Tindakan Saya" value={counts.perluTindakan} icon={Clock} accent="amber" />
        <StatCard label="Dalam Proses" value={counts.dalamProses} icon={FileText} accent="indigo" />
        <StatCard label="Selesai Bulan Ini" value={counts.selesaiBulanIni} icon={CircleCheck} accent="emerald" />
        <StatCard label="Ditolak" value={counts.ditolak} icon={CircleX} accent="rose" />
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
      {detailError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{detailError}</p>}
      {saldoError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{saldoError}</p>}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Saldo Kas Berjalan</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Saldo (Divisi Anda + Turunan)" value={formatRupiah(totalSaldo)} icon={Wallet} />
          <InfoStatCard
            title="Persentase SPP Masuk"
            period={periodeAktif}
            value={sppLoading.sppUnitMasuk || sppLoading.sppUnitAll ? '...' : `${persenSppMasukUnit}%`}
            icon={Percent}
            // TODO: "Lihat Detail" (rincian per unit) sementara di-hide dulu -
            // lihat SppUnitDetailModal di bawah, tinggal pasang lagi
            // onDetailClick={() => setShowSppDetail(true)} kalau sudah siap.
          />
        </div>
        <div className="mt-3">
          <DataTable
            columns={kolomSaldo}
            rows={saldoRows}
            emptyText={saldoLoading ? 'Memuat data...' : 'Belum ada divisi.'}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Perlu Tindakan Saya</h3>
        <DataTable
          columns={[...kolomDasar, kolomAksi]}
          rows={perluTindakan}
          emptyText={loading ? 'Memuat data...' : 'Tidak ada pengajuan yang perlu ditindaklanjuti.'}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Pengajuan Terbaru</h3>
        <DataTable
          columns={[...kolomDasar, kolomAksi]}
          rows={terbaru}
          emptyText={loading ? 'Memuat data...' : 'Belum ada pengajuan.'}
        />
      </div>

      <PengajuanFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={loadData} />

      <PengajuanDetailModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        pengajuan={selected}
        roleId={roleId}
        onActionDone={loadData}
      />

      <SppUnitDetailModal
        open={showSppDetail}
        onClose={() => setShowSppDetail(false)}
        periodLabel={periodeAktif}
        rows={sppDetailRows}
      />
    </div>
  )
}
