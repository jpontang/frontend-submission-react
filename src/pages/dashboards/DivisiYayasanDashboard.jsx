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
import { buildTree } from '../../lib/divisiTree'

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

// Sama seperti gate `canValidasiPenerimaan` di PengajuanDetailModal - kalau
// TIDAK disamakan di sini, pengajuan yang sebenarnya sudah butuh
// dikonfirmasi penerimaannya (PO terkirim/dana dicairkan) malah nyasar ke
// bucket "Dalam Proses" yang cuma statistik, tidak pernah muncul sbg
// item yang perlu ditindaklanjuti - makanya kepala/parent divisi tidak
// pernah lihat menunya. `can_konfirmasi_penerimaan` dari backend
// (PengajuanController::appendCanKonfirmasiPenerimaan) memastikan cuma
// yang benar2 berwenang (pengaju/kepala divisi/kepala parent) yang
// dihitung, bukan sekadar berstatus begitu.
function butuhKonfirmasiPenerimaan(row) {
  const sudahDikirim = row.jenis_pengajuan === 'barang' ? row.pdf_terkirim_ke_suplayer : row.sudah_dicairkan

  return (
    row.can_konfirmasi_penerimaan &&
    (row.status === 'diterima_sebagian' || (row.status === 'disetujui_bendahara' && sudahDikirim))
  )
}

function butuhTindakan(row) {
  return STATUS_PERLU_TINDAKAN.includes(row.status) || butuhKonfirmasiPenerimaan(row)
}

/**
 * Dashboard role DIVISI YAYASAN - ringkasan pengajuan divisinya sendiri +
 * turunan (dibatasi backend lewat DivisiScopeMiddleware, jadi GET
 * /yayasan/pengajuan di sini otomatis cuma balikin punya scope-nya tanpa
 * perlu filter tambahan di frontend).
 *
 * Semua akun role ini disebut "Parent Divisi" (bukan role terpisah dari
 * Kepala Divisi - satu dashboard yang sama dipakai bersama). Supaya user
 * tidak bingung dashboard ini punya/divisi unit mana (SDIT 1 vs SDIT 2 vs
 * Direktorat, dst - semuanya pakai role & dashboard yang sama), judulnya
 * disertai nama divisi root yang dipimpin user (lihat namaDivisiUtama di
 * bawah, dari root saldoRows - divisi yang parent_divisi_id-nya di luar
 * scope-nya sendiri).
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

  // Root(s) dari saldoRows = divisi yang dipimpin user sendiri (parent_divisi_id-nya
  // di luar scope, atau null). Namanya dipakai di judul dashboard supaya jelas ini
  // punya unit/divisi mana. jumlahSubDivisi dipakai buat nentuin perlu tidaknya
  // tabel breakdown saldo per sub-divisi di bawah (percuma kalau cuma 1 baris).
  const divisiTree = useMemo(() => buildTree(saldoRows), [saldoRows])
  const namaDivisiUtama = useMemo(
    () => divisiTree.map((root) => root.nama_divisi).join(', '),
    [divisiTree]
  )
  const jumlahSubDivisi = useMemo(
    () => divisiTree.reduce((sum, root) => sum + root.children.length, 0),
    [divisiTree]
  )
  const isParentDivisi = jumlahSubDivisi > 0

  const dashboardTitle = namaDivisiUtama
    ? `Dashboard Parent Divisi — ${namaDivisiUtama}`
    : 'Dashboard Parent Divisi'
  const dashboardSubtitle = isParentDivisi
    ? `Ringkasan pengajuan divisi ${namaDivisiUtama} & ${jumlahSubDivisi} sub-divisi di bawahnya.`
    : `Ringkasan pengajuan divisi ${namaDivisiUtama || 'Anda'}.`

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
    // disetujui_bendahara/diterima_sebagian yang BELUM butuh konfirmasi
    // penerimaan (mis. dana belum dicairkan/PO belum terkirim) & bermasalah
    // masih "dalam proses". Begitu sudah butuh konfirmasi (lihat
    // butuhKonfirmasiPenerimaan), dihitung perluTindakan, bukan dalamProses
    // (else if di bawah otomatis skip krn kondisi pertama sudah true).
    // Baru dihitung selesaiBulanIni begitu statusnya 'selesai'
    // (dikonfirmasi lengkap).
    rows.forEach((row) => {
      if (butuhTindakan(row)) base.perluTindakan += 1
      else if (
        ['disetujui_divisi', 'disetujui_qc', 'disetujui_bendahara', 'diterima_sebagian', 'bermasalah'].includes(
          row.status
        )
      )
        base.dalamProses += 1
      else if (row.status === 'ditolak') base.ditolak += 1

      if (row.status === 'selesai' && row.tanggal_konfirmasi) {
        const d = new Date(row.tanggal_konfirmasi)
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          base.selesaiBulanIni += 1
        }
      }
    })
    return base
  }, [rows])

  const perluTindakan = useMemo(() => rows.filter(butuhTindakan), [rows])

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
        {butuhTindakan(row) ? 'Tindak Lanjut' : 'Detail'}
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{dashboardTitle}</h1>
          <p className="text-sm text-slate-500">{dashboardSubtitle}</p>
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
          <StatCard
            label={isParentDivisi ? 'Total Saldo (Divisi Anda + Sub-Divisi)' : 'Saldo Divisi Anda'}
            value={formatRupiah(totalSaldo)}
            icon={Wallet}
          />
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
        {/* Tabel breakdown saldo per divisi cuma berguna kalau ada lebih dari
            1 baris (Parent Divisi menaungi sub-divisi). Kepala Divisi leaf
            sudah terwakili penuh oleh StatCard saldo di atas, jadi tabelnya
            di-skip supaya tidak menampilkan 1 baris yang redundan. */}
        {isParentDivisi && (
          <div className="mt-3">
            <DataTable
              columns={kolomSaldo}
              rows={saldoRows}
              emptyText={saldoLoading ? 'Memuat data...' : 'Belum ada divisi.'}
            />
          </div>
        )}
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
