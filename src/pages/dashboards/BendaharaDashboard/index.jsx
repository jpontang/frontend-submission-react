import { useEffect, useMemo, useState } from 'react'
import { Wallet, TrendingDown, TrendingUp, Users, Percent } from 'lucide-react'
import StatCard from '../../../components/StatCard'
import InfoStatCard from '../../../components/InfoStatCard'
import RevenueChart from '../../../components/RevenueChart'
import DataTable from '../../../components/DataTable'
import StatusBadge from '../../../components/StatusBadge'
import SppUnitDetailModal from '../../../components/SppUnitDetailModal'
import { useApp } from '../../../context/AppContext'
import SiswaUnitDetailModal from './SiswaUnitDetailModal'
import SiswaKelasDetailModal from './SiswaKelasDetailModal'

const CHART_DATA = [
  { label: 'Jan', value: 12 },
  { label: 'Feb', value: 18 },
  { label: 'Mar', value: 15 },
  { label: 'Apr', value: 22 },
  { label: 'Mei', value: 19 },
  { label: 'Jun', value: 25 },
]

const BUDGET = [
  { id: 1, unit: 'QC', dialokasikan: 'Rp 15.000.000', terpakai: 'Rp 9.200.000', status: 'active' },
  { id: 2, unit: 'Gudang', dialokasikan: 'Rp 8.000.000', terpakai: 'Rp 7.850.000', status: 'pending' },
  { id: 3, unit: 'Finance', dialokasikan: 'Rp 12.000.000', terpakai: 'Rp 4.100.000', status: 'active' },
]

const columns = [
  { key: 'unit', header: 'Unit' },
  { key: 'dialokasikan', header: 'Dialokasikan' },
  { key: 'terpakai', header: 'Terpakai' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

/**
 * Dashboard Bendahara: ringkasan kondisi budget lintas unit.
 */
export default function BendaharaDashboard() {
  const {
    siswaAktif,
    siswaUnit,
    siswaKelas,
    periode,
    sppMasuk,
    sppFull,
    sppUnitMasuk,
    sppUnitAll,
    loading,
    fetchAllSiswaAktif,
    fetchAllSiswaUnit,
    fetchSiswaKelas,
    fetchPeriode,
    fetchAllSppMasuk,
    fetchAllSppFull,
    fetchSppUnitMasuk,
    fetchSppUnitAll,
  } = useApp()

  const [showSiswaUnitDetail, setShowSiswaUnitDetail] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [showSppDetail, setShowSppDetail] = useState(false)

  useEffect(() => {
    fetchAllSiswaAktif()
    fetchAllSiswaUnit()
    fetchSiswaKelas()
    fetchPeriode()
    fetchAllSppMasuk()
    fetchAllSppFull()
    fetchSppUnitMasuk()
    fetchSppUnitAll()
  }, [
    fetchAllSiswaAktif,
    fetchAllSiswaUnit,
    fetchSiswaKelas,
    fetchPeriode,
    fetchAllSppMasuk,
    fetchAllSppFull,
    fetchSppUnitMasuk,
    fetchSppUnitAll,
  ])

  const periodeAktif = periode?.[0]?.nama_periode || '2026/2027'
  const bulanIni = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    []
  )
  const persenSppMasuk = sppFull ? Number(((sppMasuk / sppFull) * 100).toFixed(2)) : 0

  const sppDetailRows = useMemo(() => {
    return (sppUnitAll || []).map((unit) => {
      const masukUnit = (sppUnitMasuk || []).find((u) => u.nama_unit === unit.nama_unit)
      const masuk = Number(masukUnit?.total || 0)
      const total = Number(unit.total || 0)
      const percentage = total > 0 ? Number(((masuk / total) * 100).toFixed(2)) : 0
      return { unit: unit.nama_unit, masuk, total, percentage }
    })
  }, [sppUnitAll, sppUnitMasuk])

  const siswaKelasRows = useMemo(() => {
    if (!selectedUnit) return []
    return (siswaKelas || [])
      .filter((row) => String(row.unit) === String(selectedUnit.kode_unit))
      .map((row) => ({ kelas: row.kelas, total: row.total }))
  }, [siswaKelas, selectedUnit])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Bendahara</h1>
        <p className="text-sm text-slate-500">Ringkasan alokasi &amp; penggunaan budget bulan ini.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Budget" value="Rp 35jt" icon={Wallet} accent="indigo" />
        <StatCard label="Terpakai" value="Rp 21,1jt" icon={TrendingDown} trend={-6.2} accent="rose" />
        <StatCard label="Sisa Budget" value="Rp 13,9jt" icon={TrendingUp} trend={4.1} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" id="stat-cards-info-spp-siswa">
        <InfoStatCard
          title="Total Siswa Aktif"
          period={periodeAktif}
          value={loading.siswaAktif ? '...' : (siswaAktif ?? '-')}
          icon={Users}
          onDetailClick={() => setShowSiswaUnitDetail(true)}
        />
        <InfoStatCard
          title="Persentase SPP Masuk"
          period={periodeAktif}
          value={loading.sppMasuk || loading.sppFull ? '...' : `${persenSppMasuk}%`}
          icon={Percent}
          onDetailClick={() => setShowSppDetail(true)}
        />
      </div>

      <RevenueChart data={CHART_DATA} title="Penggunaan Budget per Bulan" />

      <div>
        <DataTable title="Budget per Unit" columns={columns} rows={BUDGET} />
      </div>

      <SiswaUnitDetailModal
        open={showSiswaUnitDetail && !selectedUnit}
        onClose={() => setShowSiswaUnitDetail(false)}
        periodLabel={periodeAktif}
        rows={siswaUnit || []}
        onSelectUnit={(unit) => setSelectedUnit(unit)}
      />

      <SiswaKelasDetailModal
        open={Boolean(selectedUnit)}
        onClose={() => {
          setSelectedUnit(null)
          setShowSiswaUnitDetail(false)
        }}
        onBack={() => setSelectedUnit(null)}
        unitName={selectedUnit?.nama_unit}
        rows={siswaKelasRows}
      />

      <SppUnitDetailModal
        open={showSppDetail}
        onClose={() => setShowSppDetail(false)}
        periodLabel={bulanIni}
        rows={sppDetailRows}
      />
    </div>
  )
}
