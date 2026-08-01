import { useEffect, useState } from 'react'
import { Wallet, History } from 'lucide-react'
import DataTable from '../components/DataTable'
import SetBudgetFormModal from '../components/SetBudgetFormModal'
import { useApp } from '../context/AppContext'
import api from '../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

/**
 * Set Budget (Unit Sekolah & Departemen) - port dari halaman Vue lama
 * (resources/js/components/bendahara/SetBudget.vue) ke React, tetap
 * konsumsi endpoint /api yang sama (SetBudgetController), tidak ada
 * perubahan backend.
 *
 * Alur "Update Set Budget Unit": pilih unit -> pendapatan (dari total
 * tagihan SPP bulan ini), potong pendapatan, & jumlah siswa aktif otomatis
 * terisi -> isi quota budget (%) -> total & budget per siswa dihitung live
 * -> simpan sbg baris baru di set_budgets utk bulan depan.
 *
 * Potong Pendapatan tab Unit Sekolah SUDAH dialihkan ke tbl_deduction_income
 * (modul Yayasan baru, menu "Potongan Pendapatan"), dijembatani lewat
 * tbl_divisi.kode_unit_siak (lihat DeductionIncomeController::potonganUnitSekolah
 * & AppContext -> potonganUnitBaru) - bukan lagi tabel `deduction_incomes`
 * lama. Tab Departemen TETAP pakai sumber lama (potonganUnit/`/potongPedapatan`)
 * krn `divisions.id` lama belum ada jembatan resmi ke tbl_divisi.id.
 */
export default function BudgetControl() {
  const {
    setBudgetUnit,
    setBudgetDept,
    totalTagihanSPP,
    deptList,
    potonganUnit,
    potonganUnitBaru,
    siswaUnit,
    loading,
    error,
    fetchSetBudgetUnit,
    fetchSetBudgetDept,
    fetchTotalTagihanSPP,
    fetchDeptList,
    fetchPotonganUnit,
    fetchPotonganUnitBaru,
    fetchAllSiswaUnit,
  } = useApp()

  const [tab, setTab] = useState('unit')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('unit')
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState(null)

  function loadAll() {
    fetchSetBudgetUnit()
    fetchSetBudgetDept()
    fetchTotalTagihanSPP()
    fetchDeptList()
    fetchPotonganUnit()
    fetchPotonganUnitBaru()
    fetchAllSiswaUnit()
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showModalUnit() {
    setModalMode('unit')
    setEditing(null)
    setShowModal(true)
  }

  function showModalDept() {
    setModalMode('dept')
    setEditing(null)
    setShowModal(true)
  }

  function showModalEdit(mode, row) {
    setModalMode(mode)
    setEditing(row)
    setShowModal(true)
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus set budget "${row.nama_unit || row.nama_divisi}"?`)) return
    setActionError(null)
    try {
      await api.delete(`/setBudget/${row.id}`)
      loadAll()
    } catch (err) {
      setActionError(err.response?.data?.msg || 'Gagal menghapus data.')
    }
  }

  const unitColumns = [
    { key: 'nama_unit', header: 'Unit' },
    { key: 'nama_jenis_biaya', header: 'Jenis Income' },
    { key: 'income', header: 'Total SPP', render: (row) => formatRupiah(row.income) },
    {
      key: 'deduction_income',
      header: 'Potong Pendapatan',
      render: (row) => formatRupiah(row.deduction_income),
    },
    { key: 'quota_budget', header: '%', render: (row) => `${row.quota_budget}%` },
    { key: 'budget', header: 'Total', render: (row) => formatRupiah(row.budget) },
    {
      key: 'deduction_budget',
      header: 'Potong Modal',
      render: (row) => formatRupiah(row.deduction_budget),
    },
    {
      key: 'addition_budget',
      header: 'Tambah Modal',
      render: (row) => formatRupiah(row.addition_budget),
    },
    {
      key: 'budget_final',
      header: 'Total Budget',
      render: (row) => formatRupiah(row.budget_final),
    },
    { key: 'jumlah_siswa', header: 'Siswa Aktif' },
    {
      key: 'budget_siswa',
      header: 'Budget Siswa',
      render: (row) => formatRupiah(row.budget_siswa),
    },
    {
      key: 'bulan_berlaku',
      header: 'Berlaku',
      render: (row) =>
        row.bulan_berlaku
          ? new Date(row.bulan_berlaku).toLocaleDateString('id-ID', {
              month: 'long',
              year: 'numeric',
            })
          : '-',
    },
    { key: 'petugas', header: 'Admin' },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => showModalEdit('unit', row)}
            className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ]

  const deptColumns = [
    { key: 'nama_divisi', header: 'Departemen' },
    { key: 'nama_jenis_biaya', header: 'Jenis Income' },
    { key: 'income', header: 'Nominal', render: (row) => formatRupiah(row.income) },
    {
      key: 'deduction_income',
      header: 'Potong Pendapatan',
      render: (row) => formatRupiah(row.deduction_income),
    },
    { key: 'quota_budget', header: '%', render: (row) => `${row.quota_budget}%` },
    { key: 'budget', header: 'Total', render: (row) => formatRupiah(row.budget) },
    {
      key: 'budget_final',
      header: 'Budget Diterima',
      render: (row) => formatRupiah(row.budget_final),
    },
    { key: 'petugas', header: 'Admin' },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => showModalEdit('dept', row)}
            className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Set Budget</h1>
          <p className="text-sm text-slate-500">
            Alokasikan budget operasional bulan depan berdasarkan pendapatan SPP unit/departemen.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={showModalUnit}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Wallet size={16} />
            Update Set Budget Unit
          </button>
          <button
            onClick={showModalDept}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <History size={16} />
            Update Set Budget Dept.
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('unit')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'unit'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Unit Sekolah
        </button>
        <button
          onClick={() => setTab('dept')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'dept'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Departemen
        </button>
      </div>

      {(error.setBudgetUnit || error.setBudgetDept || actionError) && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.setBudgetUnit || error.setBudgetDept || actionError}
        </p>
      )}

      {tab === 'unit' ? (
        <DataTable
          columns={unitColumns}
          rows={setBudgetUnit || []}
          emptyText={loading.setBudgetUnit ? 'Memuat data...' : 'Belum ada set budget unit bulan ini.'}
        />
      ) : (
        <DataTable
          columns={deptColumns}
          rows={setBudgetDept || []}
          emptyText={loading.setBudgetDept ? 'Memuat data...' : 'Belum ada set budget departemen.'}
        />
      )}

      <SetBudgetFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        mode={modalMode}
        editing={editing}
        unitOptions={totalTagihanSPP || []}
        deptOptions={deptList || []}
        potonganList={modalMode === 'unit' ? potonganUnitBaru || [] : potonganUnit || []}
        siswaUnitList={siswaUnit || []}
        onSaved={loadAll}
      />
    </div>
  )
}
