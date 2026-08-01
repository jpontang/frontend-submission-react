import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

function currentPeriode() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Saring input Quota Budget spy cuma angka + SATU pemisah desimal (koma
 * ATAU titik) yang lolos - user Indonesia biasa ketik "14,37". */
function sanitizeDecimalInput(raw) {
  let value = raw.replace(/[^0-9.,]/g, '')
  const sepIndex = value.search(/[.,]/)
  if (sepIndex !== -1) {
    value = value.slice(0, sepIndex + 1) + value.slice(sepIndex + 1).replace(/[.,]/g, '')
  }
  return value
}

/** "14,37" atau "14.37" -> 14.37 (number JS, selalu titik). */
function toNumber(value) {
  return Number(String(value).replace(',', '.')) || 0
}

function emptyForm() {
  return {
    kode_unit: '',
    kode_jenis_income: '2',
    pendapatan: 0,
    potong_pendapatan: 0,
    quota_budget: '',
    tambah_modal: '0',
    potong_hutang: '0',
    siswa_aktif: 0,
    bulan_berlaku: currentPeriode(),
  }
}

const EMPTY_PARENT_INFO = { nama_parent_divisi: null, potong_pendapatan_parent: 0 }

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

/**
 * Form Set Budget (Unit Sekolah / Departemen) - port dari
 * resources/js/components/bendahara/SetBudget.vue (showModalUnit dkk) ke
 * React, konsumsi endpoint /api yang sama (SetBudgetController).
 *
 * Alur: pilih unit/dept dari daftar (create) -> pendapatan, potong
 * pendapatan, & siswa aktif otomatis terisi dari data lain -> isi quota
 * budget (%) -> total, total budget, & budget per siswa dihitung live
 * (bukan dari input manual) -> simpan.
 */
export default function SetBudgetFormModal({
  open,
  onClose,
  mode, // 'unit' | 'dept'
  editing, // row yg diedit, atau null utk buat baru
  unitOptions = [], // dari getTotalTagihanSPP: {kode_unit, nama_unit, total_tagihan}
  deptOptions = [], // dari getDept: {id, nama_divisi}
  potonganList = [], // {kode_unit, potong_pendapatan} - mode unit: dari deduction-income/potongan-unit-sekolah (baru), mode dept: dari potongPedapatan (lama)
  siswaUnitList = [], // dari allSiswaUnit: {kode_unit, nama_unit, total}
  onSaved,
}) {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [parentInfo, setParentInfo] = useState(EMPTY_PARENT_INFO)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isEdit = Boolean(editing)
  const options = mode === 'unit' ? unitOptions : deptOptions
  const optionValue = (o) => (mode === 'unit' ? o.kode_unit : o.id)
  const optionLabel = (o) => (mode === 'unit' ? o.nama_unit : o.nama_divisi)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setForm({
        kode_unit: editing.kode_unit,
        kode_jenis_income: editing.kode_jenis_income ?? '2',
        pendapatan: editing.income ?? 0,
        potong_pendapatan: editing.deduction_income ?? 0,
        quota_budget:
          editing.quota_budget !== null && editing.quota_budget !== undefined
            ? String(editing.quota_budget).replace('.', ',')
            : '',
        tambah_modal: editing.addition_budget ?? '0',
        potong_hutang: editing.deduction_budget ?? '0',
        siswa_aktif: editing.jumlah_siswa ?? 0,
        bulan_berlaku: editing.bulan_berlaku ? editing.bulan_berlaku.slice(0, 7) : currentPeriode(),
      })
      const potongan = potonganList.find((p) => String(p.kode_unit) === String(editing.kode_unit))
      setParentInfo({
        nama_parent_divisi: potongan?.nama_parent_divisi ?? null,
        potong_pendapatan_parent: potongan?.potong_pendapatan_parent ?? 0,
      })
    } else {
      setForm(emptyForm())
      setParentInfo(EMPTY_PARENT_INFO)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  function handleSelectUnit(value) {
    const kodeUnit = value
    const unit = options.find((o) => String(optionValue(o)) === String(kodeUnit))
    const potongan = potonganList.find((p) => String(p.kode_unit) === String(kodeUnit))
    const siswa = siswaUnitList.find((s) => String(s.kode_unit) === String(kodeUnit))

    setForm({
      ...form,
      kode_unit: kodeUnit,
      pendapatan: mode === 'unit' ? unit?.total_tagihan ?? 0 : form.pendapatan,
      potong_pendapatan: potongan?.potong_pendapatan ?? 0,
      siswa_aktif: mode === 'unit' ? siswa?.total ?? 0 : form.siswa_aktif,
    })
    setParentInfo({
      nama_parent_divisi: potongan?.nama_parent_divisi ?? null,
      potong_pendapatan_parent: potongan?.potong_pendapatan_parent ?? 0,
    })
  }

  // Kalkulasi live (bukan disimpan sbg state terpisah spy selalu konsisten
  // dgn input terbaru) - persis rumus hitungTotal/hitungA/hitungB di Vue.
  const total = useMemo(() => {
    const pendapatan = Number(form.pendapatan) || 0
    const potongPendapatan = Number(form.potong_pendapatan) || 0
    const quota = toNumber(form.quota_budget)
    return ((pendapatan - potongPendapatan) * quota) / 100
  }, [form.pendapatan, form.potong_pendapatan, form.quota_budget])

  const totalBudget = useMemo(() => {
    const tambah = Number(form.tambah_modal) || 0
    const potong = Number(form.potong_hutang) || 0
    return total + tambah - potong
  }, [total, form.tambah_modal, form.potong_hutang])

  const budgetSiswa = useMemo(() => {
    const siswa = Number(form.siswa_aktif) || 0
    return siswa > 0 ? totalBudget / siswa : 0
  }, [totalBudget, form.siswa_aktif])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      kode_unit: form.kode_unit,
      kode_jenis_income: form.kode_jenis_income,
      pendapatan: form.pendapatan,
      potong_pendapatan: form.potong_pendapatan,
      quota_budget: toNumber(form.quota_budget),
      total,
      siswa_aktif: form.siswa_aktif,
      tambah_modal: form.tambah_modal,
      potong_hutang: form.potong_hutang,
      total_budget: totalBudget,
      budget_siswa: budgetSiswa,
      petugas: user?.name,
      bulan_berlaku: `${form.bulan_berlaku || currentPeriode()}-01`,
    }

    try {
      if (isEdit) {
        await api.put(`/setBudget/${editing.id}`, payload)
      } else {
        await api.post('/setBudget', payload)
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menyimpan set budget.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${isEdit ? 'Edit' : 'Update'} Set Budget ${mode === 'unit' ? 'Unit' : 'Dept.'}`}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="set-budget-form"
            disabled={
              saving ||
              !form.kode_unit ||
              !form.quota_budget ||
              toNumber(form.quota_budget) < 0 ||
              toNumber(form.quota_budget) > 100
            }
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : isEdit ? 'Ubah' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="set-budget-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {mode === 'unit' ? 'Unit' : 'Departemen'}
          </label>
          <select
            required
            disabled={isEdit}
            value={form.kode_unit}
            onChange={(e) => handleSelectUnit(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
          >
            <option value="" disabled>
              {mode === 'unit' ? 'Pilih unit' : 'Pilih departemen'}
            </option>
            {options.map((o) => (
              <option key={optionValue(o)} value={optionValue(o)}>
                {optionLabel(o)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Biaya</label>
          <select
            value={form.kode_jenis_income}
            onChange={(e) => setForm({ ...form, kode_jenis_income: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="2">SPP</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pendapatan</label>
            <input
              type="text"
              readOnly
              value={formatRupiah(form.pendapatan)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Potong Pendapatan</label>
            <input
              type="text"
              readOnly
              value={formatRupiah(form.potong_pendapatan)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {mode === 'unit' && parentInfo.nama_parent_divisi && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Total Potong Pendapatan - {parentInfo.nama_parent_divisi}
            </label>
            <input
              type="text"
              readOnly
              value={formatRupiah(parentInfo.potong_pendapatan_parent)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Gabungan potongan pendapatan semua unit di bawah induk divisi yang sama (dari menu
              Potongan Pendapatan), sekadar info - bukan bagian dari kalkulasi budget unit ini.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Quota Budget (%)</label>
          <input
            type="text"
            inputMode="decimal"
            required
            placeholder="Contoh: 14,37"
            value={form.quota_budget}
            onChange={(e) => setForm({ ...form, quota_budget: sanitizeDecimalInput(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {form.quota_budget !== '' && (toNumber(form.quota_budget) < 0 || toNumber(form.quota_budget) > 100) && (
            <p className="mt-1 text-xs text-rose-600">Quota budget harus di antara 0 - 100%.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Total</label>
          <input
            type="text"
            readOnly
            value={formatRupiah(total)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tambah Modal</label>
            <input
              type="number"
              value={form.tambah_modal}
              onChange={(e) => setForm({ ...form, tambah_modal: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Potong Modal</label>
            <input
              type="number"
              value={form.potong_hutang}
              onChange={(e) => setForm({ ...form, potong_hutang: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Total Budget</label>
            <input
              type="text"
              readOnly
              value={formatRupiah(totalBudget)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Budget Siswa</label>
            <input
              type="text"
              readOnly
              value={formatRupiah(budgetSiswa)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Waktu Berlaku</label>
            <input
              type="month"
              required
              value={form.bulan_berlaku}
              onChange={(e) => setForm({ ...form, bulan_berlaku: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Petugas</label>
            <input
              type="text"
              readOnly
              value={user?.name || ''}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  )
}
