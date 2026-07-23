/**
 * Gabungan beberapa sumber data dashboard bendahara (semua sudah di-fetch
 * lewat AppContext): allSiswaAktif, allSiswaUnit, siswaKelas, allSppFull,
 * sppUnitAll, sppKelasAll. Dipakai bareng untuk tabel per-unit dan tree
 * Sekolah > Unit > Kelas, supaya tidak ada logic gabung yang keduplikasi di
 * beberapa tempat.
 */

/**
 * Baris per-unit siap pakai di DataTable: gabungan total siswa (siswaUnit)
 * dan total tagihan SPP (sppUnitAll) berdasarkan kode_unit, plus jumlah
 * kelas dari sppKelasAll.
 */
export function buildUnitRows({ siswaUnit = [], sppUnitAll = [], sppKelasAll = [] } = {}) {
  const sppByUnit = new Map(sppUnitAll.map((row) => [String(row.kode_unit), row]))
  const kelasCountByUnit = new Map()

  sppKelasAll.forEach((row) => {
    const key = String(row.kode_unit)
    kelasCountByUnit.set(key, (kelasCountByUnit.get(key) || 0) + 1)
  })

  return siswaUnit.map((unit) => {
    const key = String(unit.kode_unit)
    const spp = sppByUnit.get(key)

    return {
      kode_unit: unit.kode_unit,
      nama_unit: unit.nama_unit,
      totalSiswa: Number(unit.total || 0),
      totalSpp: Number(spp?.total || 0),
      jumlahKelas: kelasCountByUnit.get(key) || 0,
    }
  })
}

/**
 * Tree 3 level: root "Yayasan" (total dari allSiswaAktif/allSppFull) ->
 * Unit (dari allSiswaUnit + sppUnitAll) -> Kelas (dari sppKelasAll, sudah
 * dikelompokkan per id_kelas jadi aman dari tabrakan nama kelas yang sama
 * di unit berbeda). Tiap node kelas bawa `id_kelas` supaya UI bisa fetch
 * detail per siswa (POST /sppSiswaKelas) saat diklik.
 */
export function buildSiswaSppTree({
  siswaAktif = 0,
  siswaUnit = [],
  sppFull = 0,
  sppUnitAll = [],
  sppKelasAll = [],
} = {}) {
  const unitRows = buildUnitRows({ siswaUnit, sppUnitAll, sppKelasAll })

  const kelasByUnit = new Map()
  sppKelasAll.forEach((row) => {
    const key = String(row.kode_unit)
    if (!kelasByUnit.has(key)) kelasByUnit.set(key, [])
    kelasByUnit.get(key).push(row)
  })

  const units = unitRows.map((unit) => ({
    id: `unit-${unit.kode_unit}`,
    nama: unit.nama_unit,
    totalSiswa: unit.totalSiswa,
    totalSpp: unit.totalSpp,
    children: (kelasByUnit.get(String(unit.kode_unit)) || []).map((row) => ({
      id: `kelas-${row.id_kelas}`,
      id_kelas: row.id_kelas,
      nama: row.nama_kelas,
      totalSiswa: Number(row.total_siswa || 0),
      totalSpp: Number(row.total || 0),
      children: [],
    })),
  }))

  return {
    id: 'root',
    nama: 'Yayasan',
    totalSiswa: Number(siswaAktif || 0),
    totalSpp: Number(sppFull || 0),
    children: units,
  }
}
