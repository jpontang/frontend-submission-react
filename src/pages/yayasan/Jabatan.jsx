import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import api from '../../lib/api'

const EMPTY_FORM = { nama_jabatan: '', level: '' }

export default function Jabatan() {
  const [items, setItems] = useState([])
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
      const { data } = await api.get('/yayasan/jabatan')
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data jabatan.')
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
    return items.filter((item) => item.nama_jabatan?.toLowerCase().includes(q))
  }, [items, search])

  function openAddModal() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(item) {
    setEditing(item)
    setForm({ nama_jabatan: item.nama_jabatan || '', level: item.level ?? '' })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await api.put(`/yayasan/jabatan/${editing.id}`, form)
      } else {
        await api.post('/yayasan/jabatan', form)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.msg || 'Gagal menyimpan jabatan.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus jabatan "${item.nama_jabatan}"?`)) return
    try {
      await api.delete(`/yayasan/jabatan/${item.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus jabatan.')
    }
  }

  const columns = [
    { key: 'nama_jabatan', header: 'Nama Jabatan' },
    { key: 'level', header: 'Level' },
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
          <h1 className="text-xl font-semibold text-slate-900">Jabatan</h1>
          <p className="text-sm text-slate-500">Kelola daftar jabatan struktural yayasan.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah Jabatan
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama jabatan..."
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyText="Belum ada jabatan" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Jabatan' : 'Tambah Jabatan'}
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
              form="jabatan-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="jabatan-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Jabatan</label>
            <input
              type="text"
              required
              value={form.nama_jabatan}
              onChange={(e) => setForm({ ...form, nama_jabatan: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Contoh: Ketua Yayasan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Level <span className="text-slate-400">(1 = tertinggi)</span>
            </label>
            <input
              type="number"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
