import { useEffect, useMemo, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import DataTable from '../components/DataTable'
import SiswaSppTree from '../components/SiswaSppTree'
import SppSiswaKelasModal from '../components/SppSiswaKelasModal'
import { buildSiswaSppTree, buildUnitRows } from '../lib/siswaSppTree'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const unitColumns = [
  { key: 'nama_unit', header: 'Unit' },
  { key: 'totalSiswa', header: 'Total Siswa Aktif' },
  { key: 'jumlahKelas', header: 'Jumlah Kelas' },
  {
    key: 'totalSpp',
    header: 'Total Tagihan SPP',
    render: (row) => formatRupiah(row.totalSpp),
  },
]

/**
 * Referensi jenis biaya (kategori penerimaan/SPP) untuk role Bendahara.
 * Data diambil dari database siak lewat GET /api/getJenisBiaya.
 *
 * Bagian bawah menggabungkan allSiswaAktif, allSiswaUnit, allSppFull,
 * sppUnitAll, sppKelasAll (di-fetch bareng lewat AppContext) jadi satu
 * tabel per-unit + tree Yayasan > Unit > Kelas. Klik node kelas membuka
 * detail tagihan SPP aktif per siswa (POST /sppSiswaKelas).
 */
export default function Penerimaan() {
  const {
    jenisBiaya,
    siswaAktif,
    siswaUnit,
    sppFull,
    sppUnitAll,
    sppKelasAll,
    loading,
    error,
    fetchJenisBiaya,
    fetchAllSiswaAktif,
    fetchAllSiswaUnit,
    fetchAllSppFull,
    fetchSppUnitAll,
    fetchSppKelasAll,
  } = useApp()
  const [search, setSearch] = useState('')
  const [selectedKelas, setSelectedKelas] = useState(null)

  useEffect(() => {
    fetchJenisBiaya()
    fetchAllSiswaAktif()
    fetchAllSiswaUnit()
    fetchAllSppFull()
    fetchSppUnitAll()
    fetchSppKelasAll()
  }, [
    fetchJenisBiaya,
    fetchAllSiswaAktif,
    fetchAllSiswaUnit,
    fetchAllSppFull,
    fetchSppUnitAll,
    fetchSppKelasAll,
  ])

  const unitRows = useMemo(
    () =>
      buildUnitRows({
        siswaUnit: siswaUnit || [],
        sppUnitAll: sppUnitAll || [],
        sppKelasAll: sppKelasAll || [],
      }),
    [siswaUnit, sppUnitAll, sppKelasAll]
  )

  const siswaSppTree = useMemo(
    () =>
      buildSiswaSppTree({
        siswaAktif,
        siswaUnit: siswaUnit || [],
        sppFull,
        sppUnitAll: sppUnitAll || [],
        sppKelasAll: sppKelasAll || [],
      }),
    [siswaAktif, siswaUnit, sppFull, sppUnitAll, sppKelasAll]
  )

  const rekapLoading =
    loading.siswaAktif || loading.siswaUnit || loading.sppFull || loading.sppUnitAll || loading.sppKelasAll

  const rows = useMemo(() => {
    const list = jenisBiaya || []
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((row) => row.nama_jenis_biaya?.toLowerCase().includes(q))
  }, [jenisBiaya, search])

  return (
    <div className="space-y-6"> 
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Rekap Siswa &amp; SPP per Unit</h2>
        <p className="text-sm text-slate-500">
          Gabungan siswa aktif, kelas, dan tagihan SPP dari seluruh unit
          {rekapLoading && ' (memuat...)'}
        </p>
      </div>

      {(error.siswaAktif || error.siswaUnit || error.sppFull || error.sppUnitAll || error.sppKelasAll) && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.siswaAktif || error.siswaUnit || error.sppFull || error.sppUnitAll || error.sppKelasAll}
        </p>
      )}

      <DataTable
        columns={unitColumns}
        rows={unitRows}
        emptyText={rekapLoading ? 'Memuat data...' : 'Belum ada data.'}
      />

      <div>
        <p className="mb-2 text-xs text-slate-400">Klik nama kelas untuk lihat tagihan per siswa.</p>
        <SiswaSppTree tree={siswaSppTree} onSelectKelas={setSelectedKelas} />
      </div>

      <SppSiswaKelasModal
        open={Boolean(selectedKelas)}
        onClose={() => setSelectedKelas(null)}
        kelas={selectedKelas}
      />
    </div>
  )
}
