import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import api from '../../lib/api'

const EMPTY_FORM = {
  lembaga_id: '',
  nama_aset: '',
  kategori: '',
  nilai_perolehan: '',
  tanggal_perolehan: '',
  kondisi: 'baik',
  lokasi: '',
}

const KONDISI_LABEL = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
}

const KONDISI_BADGE = {
  baik: 'bg-emerald-50 text-emerald-700',
  rusak_ringan: 'bg-amber-50 text-amber-700',
  rusak_berat: 'bg-rose-50 text-rose-700',
}

function formatRupiah(value) {
  const number = Number(value || 0)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number)
}

export default function Aset() {
  const [items, setItems] = useState([])
  const [lembagaList, setLembagaList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [asetRes, lembagaRes] = await Promise.all([
        api.get('/yayasan/aset'),
        api.get('/yayasan/lembaga'),
      ])
      setItems(asetRes.data)
      setLembagaList(lembagaRes.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data aset.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.nama_aset?.toLowerCase().includes(q))
  }, [items, search])

  function openAddModal() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(item) {
    setEditing(item)
    setForm({
      lembaga_id: item.lembaga_id ?? '',
      nama_aset: item.nama_aset || '',
      kategori: item.kategori || '',
      nilai_perolehan: item.nilai_perolehan ?? '',
      tanggal_perolehan: item.tanggal_perolehan || '',
      kondisi: item.kondisi || 'baik',
      lokasi: item.lokasi || '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await api.put(`/yayasan/aset/${editing.id}`, form)
      } else {
        await api.post('/yayasan/aset', form)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.msg || 'Gagal menyimpan aset.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus aset "${item.nama_aset}"?`)) return
    try {
      await api.delete(`/yayasan/aset/${item.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus aset.')
    }
  }

  const columns = [
    { key: 'nama_aset', header: 'Nama Aset' },
    { key: 'kategori', header: 'Kategori' },
    { key: 'nilai_perolehan', header: 'Nilai Perolehan', render: (row) => formatRupiah(row.nilai_perolehan) },
    { key: 'lokasi', header: 'Lokasi' },
    {
      key: 'kondisi',
      header: 'Kondisi',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${KONDISI_BADGE[row.kondisi] || 'bg-slate-100 text-slate-500'}`}>
          {KONDISI_LABEL[row.kondisi] || row.kondisi}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={14} />
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Aset</h1>
          <p className="text-sm text-slate-500">Kelola data aset/inventaris lembaga.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah Aset
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama aset..."
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyText="Belum ada aset" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Aset' : 'Tambah Aset'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="aset-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="aset-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lembaga</label>
            <select
              required
              value={form.lembaga_id}
              onChange={(e) => setForm({ ...form, lembaga_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Pilih lembaga
              </option>
              {lembagaList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama_lembaga}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama Aset</label>
              <input
                type="text"
                required
                value={form.nama_aset}
                onChange={(e) => setForm({ ...form, nama_aset: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
              <input
                type="text"
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Contoh: Bangunan, Kendaraan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nilai Perolehan (Rp)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.nilai_perolehan}
                onChange={(e) => setForm({ ...form, nilai_perolehan: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Perolehan</label>
              <input
                type="date"
                value={form.tanggal_perolehan}
                onChange={(e) => setForm({ ...form, tanggal_perolehan: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lokasi</label>
            <input
              type="text"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kondisi</label>
            <select
              value={form.kondisi}
              onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="rusak_berat">Rusak Berat</option>
            </select>
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
