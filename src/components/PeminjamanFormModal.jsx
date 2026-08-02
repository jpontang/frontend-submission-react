import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import api from '../lib/api'

const EMPTY_FORM = {
  divisi_id: '',
  divisi_pemberi_id: '',
  nominal: '',
  keperluan: '',
  tanggal_pinjam: new Date().toISOString().slice(0, 10),
  jatuh_tempo: '',
}

/**
 * Form ajukan peminjaman antar-divisi. Dropdown "Divisi Peminjam" diisi dari
 * GET /yayasan/divisi (dipersempit backend ke scope pengaju). Dropdown
 * "Divisi Pemberi" diisi dari GET /yayasan/divisi-saldo - dipakai cuma
 * nama & id-nya (bukan scoped spy pengaju bisa pilih pemberi di luar
 * scope-nya), SALDO-nya sengaja TIDAK ditampilkan di modal ini. Kecukupan
 * saldo divisi pemberi tetap divalidasi di backend saat ACC Bendahara
 * (lihat Peminjaman::approveBendahara()).
 */
export default function PeminjamanFormModal({ open, onClose, onSaved }) {
  const [divisiList, setDivisiList] = useState([])
  const [divisiSemuaList, setDivisiSemuaList] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setError(null)
    api
      .get('/yayasan/divisi')
      .then(({ data }) => setDivisiList(data))
      .catch(() => {})
    api
      .get('/yayasan/divisi-saldo')
      .then(({ data }) => setDivisiSemuaList(data))
      .catch(() => {})
  }, [open])

  const pemberiOptions = useMemo(
    () => divisiSemuaList.filter((d) => String(d.id) !== String(form.divisi_id)),
    [divisiSemuaList, form.divisi_id]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post('/yayasan/peminjaman', {
        divisi_id: form.divisi_id,
        divisi_pemberi_id: form.divisi_pemberi_id,
        nominal: Number(form.nominal) || 0,
        keperluan: form.keperluan || null,
        tanggal_pinjam: form.tanggal_pinjam || null,
        jatuh_tempo: form.jatuh_tempo || null,
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengajukan peminjaman.')
      document.getElementById('peminjaman-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajukan Peminjaman Baru"
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
            form="peminjaman-form"
            disabled={saving || !form.divisi_id || !form.divisi_pemberi_id || !form.nominal}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Mengajukan...' : 'Ajukan'}
          </button>
        </>
      }
    >
      <form id="peminjaman-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Divisi Peminjam</label>
            <select
              required
              value={form.divisi_id}
              onChange={(e) => setForm({ ...form, divisi_id: e.target.value, divisi_pemberi_id: '' })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Pilih divisi peminjam
              </option>
              {divisiList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.parent_divisi_id ? `— ${d.nama_divisi}` : d.nama_divisi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Divisi Pemberi</label>
            <select
              required
              value={form.divisi_pemberi_id}
              onChange={(e) => setForm({ ...form, divisi_pemberi_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Pilih divisi pemberi
              </option>
              {pemberiOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.parent_divisi_id ? `— ${d.nama_divisi}` : d.nama_divisi}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nominal Pinjaman</label>
          <input
            type="number"
            required
            min="1"
            value={form.nominal}
            onChange={(e) => setForm({ ...form, nominal: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Keperluan</label>
          <textarea
            rows={2}
            value={form.keperluan}
            onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Pinjam</label>
            <input
              type="date"
              value={form.tanggal_pinjam}
              onChange={(e) => setForm({ ...form, tanggal_pinjam: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jatuh Tempo</label>
            <input
              type="date"
              value={form.jatuh_tempo}
              onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
