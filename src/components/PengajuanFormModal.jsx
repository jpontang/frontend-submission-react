import { useEffect, useState } from 'react'
import Modal from './Modal'
import DetilPengajuanEditor, { EMPTY_ITEM } from './DetilPengajuanEditor'
import api from '../lib/api'

const EMPTY_FORM = {
  divisi_id: '',
  jenis_pengajuan: 'dana',
  nama_kegiatan: '',
  tgl_pelaksanaan: '',
  deskripsi: '',
  kode_sumber_dana: '',
  kode_suplayer: '',
  nama_bank: '',
  no_rekening: '',
  nama_pemilik_rekening: '',
}

/**
 * Form ajukan pengajuan baru (dana/pengadaan barang). Dropdown divisi
 * diisi dari GET /yayasan/divisi - backend sudah otomatis mempersempit
 * daftarnya ke scope user (divisi sendiri + turunan) lewat
 * DivisiScopeMiddleware, jadi tidak perlu filter tambahan di sini.
 *
 * jenis='barang' wajib pilih supplier (jadi tujuan PO setelah disetujui
 * bendahara). jenis='dana' minta info rekening tujuan transfer (dipakai
 * di "Daftar Pencairan Dana" Bendahara).
 */
export default function PengajuanFormModal({ open, onClose, onSaved }) {
  const [divisiList, setDivisiList] = useState([])
  const [suplayerList, setSuplayerList] = useState([])
  const [sumberDanaList, setSumberDanaList] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setItems([{ ...EMPTY_ITEM }])
    setError(null)
    api
      .get('/yayasan/divisi')
      .then(({ data }) => setDivisiList(data))
      .catch(() => {})
    api
      .get('/suplayer')
      .then(({ data }) => setSuplayerList(data))
      .catch(() => {})
    api
      .get('/kode-dana')
      .then(({ data }) => setSumberDanaList(data))
      .catch(() => {})
  }, [open])

  const isBarang = form.jenis_pengajuan === 'barang'
  const selectedSumberDana = sumberDanaList.find((s) => String(s.id) === String(form.kode_sumber_dana))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post('/yayasan/pengajuan', {
        ...form,
        nama_sumber_dana: selectedSumberDana?.name || null,
        detil: items.map((item) => ({
          uraian: item.uraian,
          qty: Number(item.qty) || 1,
          satuan: item.satuan || null,
          harga: Number(item.harga) || 0,
          ppn: Number(item.ppn) || 0,
        })),
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengajukan.')
      document.getElementById('pengajuan-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajukan Pengajuan Baru"
      size="xl"
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
            form="pengajuan-form"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Mengajukan...' : 'Ajukan'}
          </button>
        </>
      }
    >
      <form id="pengajuan-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Divisi</label>
            <select
              required
              value={form.divisi_id}
              onChange={(e) => setForm({ ...form, divisi_id: e.target.value })}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Pengajuan</label>
            <select
              value={form.jenis_pengajuan}
              onChange={(e) => setForm({ ...form, jenis_pengajuan: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="dana">Pengajuan Dana</option>
              <option value="barang">Pengadaan Barang</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nama Kegiatan</label>
          <input
            type="text"
            value={form.nama_kegiatan}
            onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Pelaksanaan</label>
          <input
            type="date"
            value={form.tgl_pelaksanaan}
            onChange={(e) => setForm({ ...form, tgl_pelaksanaan: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
          <textarea
            rows={2}
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Sumber Dana</label>
          <select
            value={form.kode_sumber_dana}
            onChange={(e) => setForm({ ...form, kode_sumber_dana: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Tidak ditentukan</option>
            {sumberDanaList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {isBarang ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Supplier</label>
            <select
              required
              value={form.kode_suplayer}
              onChange={(e) => setForm({ ...form, kode_suplayer: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Pilih supplier
              </option>
              {suplayerList.map((s) => (
                <option key={s.kode_suplayer} value={s.kode_suplayer}>
                  {s.nama_suplayer}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              PO akan dikirim ke supplier ini setelah disetujui Bendahara.
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Rekening Tujuan Transfer
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Bank</label>
                <input
                  type="text"
                  value={form.nama_bank}
                  onChange={(e) => setForm({ ...form, nama_bank: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">No. Rekening</label>
                <input
                  type="text"
                  value={form.no_rekening}
                  onChange={(e) => setForm({ ...form, no_rekening: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama Pemilik</label>
                <input
                  type="text"
                  value={form.nama_pemilik_rekening}
                  onChange={(e) => setForm({ ...form, nama_pemilik_rekening: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rincian Item</label>
          <DetilPengajuanEditor items={items} onChange={setItems} />
        </div>
      </form>
    </Modal>
  )
}
