import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import api from '../lib/api'

const AppContext = createContext(null)

/**
 * Daftar resource dashboard lintas role & endpoint API-nya (semua di-guard auth:sanctum
 * di routes/api.php). key dipakai sebagai nama state/loading/error, fetchName sebagai
 * nama fungsi yang dipanggil dari komponen, mis. useApp().fetchAllSppMasuk().
 */
const RESOURCES = [
  { key: 'siswaAktif', endpoint: '/allSiswaAktif', fetchName: 'fetchAllSiswaAktif' },
  { key: 'siswaUnit', endpoint: '/allSiswaUnit', fetchName: 'fetchAllSiswaUnit' },
  { key: 'siswaKelas', endpoint: '/siswaKelas', fetchName: 'fetchSiswaKelas' },
  { key: 'periode', endpoint: '/periode', fetchName: 'fetchPeriode' },
  { key: 'sppMasuk', endpoint: '/allSppMasuk', fetchName: 'fetchAllSppMasuk' },
  { key: 'sppFull', endpoint: '/allSppFull', fetchName: 'fetchAllSppFull' },
  { key: 'sppUnitMasuk', endpoint: '/sppUnitMasuk', fetchName: 'fetchSppUnitMasuk' },
  { key: 'sppUnitAll', endpoint: '/sppUnitAll', fetchName: 'fetchSppUnitAll' },
  { key: 'sppKelasAll', endpoint: '/sppKelasAll', fetchName: 'fetchSppKelasAll' },
  { key: 'budgetDept', endpoint: '/budgetDept', fetchName: 'fetchBudgetDept' },
  { key: 'totalTagihanSPP', endpoint: '/getTotalTagihanSPP', fetchName: 'fetchTotalTagihanSPP' },
  { key: 'jenisBiaya', endpoint: '/getJenisBiaya', fetchName: 'fetchJenisBiaya', method: 'get' },
]

function initialStateOf(value) {
  return Object.fromEntries(RESOURCES.map((r) => [r.key, value]))
}

/**
 * Menyimpan data ringkasan siswa/SPP/budget yang dipakai lintas dashboard
 * (Bendahara, Unit, dll) supaya tidak perlu duplikasi pemanggilan API di tiap halaman.
 */
export function AppProvider({ children }) {
  const [data, setData] = useState(() => initialStateOf(null))
  const [loading, setLoading] = useState(() => initialStateOf(false))
  const [error, setError] = useState(() => initialStateOf(null))

  const fetchResource = useCallback((key, endpoint, method = 'post') => {
    setLoading((prev) => ({ ...prev, [key]: true }))
    setError((prev) => ({ ...prev, [key]: null }))

    return api[method](endpoint)
      .then(({ data: result }) => {
        setData((prev) => ({ ...prev, [key]: result }))
        return result
      })
      .catch((err) => {
        setError((prev) => ({
          ...prev,
          [key]: err.response?.data?.msg || `Gagal memuat data ${key}.`,
        }))
        throw err
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, [key]: false }))
      })
  }, [])

  const fetchers = useMemo(
    () =>
      Object.fromEntries(
        RESOURCES.map(({ key, endpoint, fetchName, method }) => [
          fetchName,
          () => fetchResource(key, endpoint, method),
        ])
      ),
    [fetchResource]
  )

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      ...fetchers,
    }),
    [data, loading, error, fetchers]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
