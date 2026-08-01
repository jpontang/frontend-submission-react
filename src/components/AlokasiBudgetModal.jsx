import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import api from '../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function bulanIniLabel() {
  return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

const EMPTY_FORM = {
  divisi_id: '',
  quota_budget: '',
  tambah_modal: '0',
  potong_hutang: '0',
  nominal_manual: '',
}

/**
 * Set Budget versi divisi yayasan (parent maupun anak) - dicatat sbg
 * tbl_kas_transaksi jenis 'pemasukan' (nambah saldo), reuse
 * POST /yayasan/kas-transaksi yang sudah ada.
 *
 * Divisi yang punya kode_unit_siak (SDIT/TKIT/MI/Playgroup - lihat
 * migration add_kode_unit_siak_to_tbl_divisi_table) pakai rumus:
 * Total = (Pendapatan SPP - Potong Pendapatan) x Quota% ; Nominal = Total +
 * Tambah Modal - Potong Modal. Pendapatan diambil dari sppUnitAll (SIAK,
 * cuma tersedia utk unit sekolah). Potong Pendapatan diambil dari
 * tbl_deduction_income (menu "Potongan Pendapatan") - dijumlah per
 * divisi_id, jadi berlaku utk SETIAP divisi (parent maupun anak) yang
 * dibedakan lewat kode_divisi, bukan cuma yang ber-kode_unit_siak seperti
 * sumber pendapatannya. Potongan bersifat bulanan - deductionIncomeList yang
 * dikirim ke modal ini HARUS sudah difilter periode bulan berjalan (lihat
 * KasTransaksi.jsx::loadDeductionIncome), modal ini sendiri cuma menjumlah
 * apa yang diterima tanpa menyaring periode lagi.
 *
 * Divisi tanpa kode_unit_siak (belum ada data pendapatan SPP) pakai
 * nominal manual, tapi potongan pendapatannya (kalau ada dicatat di menu
 * Potongan Pendapatan) tetap ditampilkan sbg info.
 */
export default function AlokasiBudgetModal({
  open,
  onClose,
  divisiList = [], // dari /yayasan/divisi (sudah termasuk kode_unit_siak)
  sppUnitAll = [], // dari sppUnitAll: {kode_unit, nama_unit, total}
  deductionIncomeList = [], // dari /yayasan/deduction-income: {divisi_id, uraian, besaran}
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setError(null)
    }
  }, [open])

  const selectedDivisi = divisiList.find((d) => String(d.id) === String(form.divisi_id))
  const hasFormula = Boolean(selectedDivisi?.kode_unit_siak)

  const pendapatan = useMemo(() => {
    if (!hasFormula) return 0
    return sppUnitAll.find((u) => String(u.kode_unit) === String(selectedDivisi.kode_unit_siak))?.total ?? 0
  }, [hasFormula, selectedDivisi, sppUnitAll])

  const potongPendapatan = useMemo(() => {
    if (!selectedDivisi) return 0
    return deductionIncomeList
      .filter((d) => String(d.divisi_id) === String(selectedDivisi.id))
      .reduce((sum, d) => sum + (Number(d.besaran) || 0), 0)
  }, [selectedDivisi, deductionIncomeList])

  const total = useMemo(() => {
    if (!hasFormula) return 0
    const quota = Number(form.quota_budget) || 0
    return ((pendapatan - potongPendapatan) * quota) / 100
  }, [hasFormula, pendapatan, potongPendapatan, form.quota_budget])

  const nominal = useMemo(() => {
    if (!hasFormula) return Number(form.nominal_manual) || 0
    const tambah = Number(form.tambah_modal) || 0
    const potong = Number(form.potong_hutang) || 0
    return total + tambah - potong
  }, [hasFormula, total, form.tambah_modal, form.potong_hutang, form.nominal_manual])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const uraian = `Alokasi Budget Operasional ${bulanIniLabel()} - ${selectedDivisi?.nama_divisi || ''}`

    try {
      await api.post('/yayasan/kas-transaksi', {
        divisi_id: form.divisi_id,
        jenis_transaksi: 'pemasukan',
        uraian,
        keterangan: hasFormula
          ? `Quota ${form.quota_budget}% dari pendapatan SPP Rp ${pendapatan} (potong pendapatan Rp ${potongPendapatan}), tambah modal Rp ${form.tambah_modal}, potong modal Rp ${form.potong_hutang}.`
          : null,
        detil: [{ uraian, qty: 1, harga_satuan: nominal }],
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menyimpan alokasi budget.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Alokasikan Budget Divisi"
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
            form="alokasi-budget-form"
            disabled={saving || !form.divisi_id || (hasFormula ? !form.quota_budget : !form.nominal_manual)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="alokasi-budget-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Divisi / Parent Divisi
          </label>
          <select
            required
            value={form.divisi_id}
            onChange={(e) => setForm({ ...EMPTY_FORM, divisi_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Pilih divisi
            </option>
            {divisiList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.parent_divisi_id ? `— ${d.nama_divisi}` : d.nama_divisi}
              </option>
            ))}
          </select>
        </div>

        {selectedDivisi && hasFormula && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pendapatan SPP ({bulanIniLabel()})
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatRupiah(pendapatan)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Potong Pendapatan</label>
                <input
                  type="text"
                  readOnly
                  value={formatRupiah(potongPendapatan)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quota Budget (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={form.quota_budget}
                onChange={(e) => setForm({ ...form, quota_budget: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
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
          </>
        )}

        {selectedDivisi && !hasFormula && (
          <div className="space-y-4">
            {potongPendapatan > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Potong Pendapatan Tercatat
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatRupiah(potongPendapatan)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Dari menu Potongan Pendapatan - jadi bahan pertimbangan, belum otomatis
                  dikurangkan dari nominal manual.
                </p>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nominal</label>
              <input
                type="number"
                required
                min="0"
                value={form.nominal_manual}
                onChange={(e) => setForm({ ...form, nominal_manual: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Divisi ini belum terhubung ke data pendapatan SPP unit, jadi nominal diisi manual.
              </p>
            </div>
          </div>
        )}

        {selectedDivisi && (
          <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-2.5 text-sm">
            <span className="font-medium text-indigo-700">Nominal Alokasi</span>
            <span className="font-semibold text-indigo-900">{formatRupiah(nominal)}</span>
          </div>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  )
}
