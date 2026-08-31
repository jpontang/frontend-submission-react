import { useEffect, useState } from 'react'
import Modal from './Modal'
import api from '../lib/api'

const EMPTY_FORM = {
  uraian: '',
  keterangan: '',
  tanggal_transaksi: '',
  nominal: '',
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Catat pengeluaran kas manual utk divisi Yayasan (kode_divisi=YAYASAN) -
 * mis. biaya operasional yayasan yang bukan bagian dari alur Pengajuan
 * per-divisi biasa. Reuse POST /yayasan/kas-transaksi yang sudah ada,
 * jenis_transaksi='pengeluaran' (khusus admin, lihat KasTransaksiController::store()),
 * arah otomatis 'keluar' & saldo langsung terpotong begitu tersimpan (tidak
 * ada tahap approval terpisah lagi spt alur Pengajuan divisi biasa).
 */
export default function PengeluaranKasYayasanModal({ open, onClose, divisiId, saldoSaatIni = 0, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, tanggal_transaksi: todayInputValue() })
      setError(null)
    }
  }, [open])

  const nominal = Number(form.nominal) || 0
  const saldoSetelah = saldoSaatIni - nominal

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post('/yayasan/kas-transaksi', {
        divisi_id: divisiId,
        jenis_transaksi: 'pengeluaran',
        uraian: form.uraian,
        keterangan: form.keterangan || null,
        tanggal_transaksi: form.tanggal_transaksi || null,
        detil: [{ uraian: form.uraian, qty: 1, harga_satuan: nominal }],
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mencatat pengeluaran.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Pengeluaran Kas Yayasan"
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
            form="pengeluaran-kas-yayasan-form"
            disabled={saving || !form.uraian || !nominal}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="pengeluaran-kas-yayasan-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Uraian</label>
          <input
            type="text"
            required
            placeholder="mis. Biaya operasional kantor yayasan bulan Agustus"
            value={form.uraian}
            onChange={(e) => setForm({ ...form, uraian: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Keterangan <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea
            rows={2}
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Transaksi</label>
            <input
              type="date"
              value={form.tanggal_transaksi}
              onChange={(e) => setForm({ ...form, tanggal_transaksi: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nominal</label>
            <input
              type="number"
              required
              min="0"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {nominal > saldoSaatIni && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Nominal melebihi saldo kas Yayasan saat ini - kemungkinan akan ditolak backend.
          </p>
        )}

        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-rose-700">Saldo Setelah Pengeluaran</span>
          <span className="font-semibold text-rose-900">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
              saldoSetelah
            )}
          </span>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  )
}
