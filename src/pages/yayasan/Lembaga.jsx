import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import api from '../../lib/api'

const EMPTY_FORM = {
  nama_lembaga: '',
  no_akta_pendirian: '',
  no_sk_kemenkumham: '',
  npwp: '',
  alamat: '',
  email: '',
  telepon: '',
  tanggal_berdiri: '',
  status: 'aktif',
}

export default function Lembaga() {
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
      const { data } = await api.get('/yayasan/lembaga')
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data lembaga.')
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
    return items.filter((item) => item.nama_lembaga?.toLowerCase().includes(q))
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
      nama_lembaga: item.nama_lembaga || '',
      no_akta_pendirian: item.no_akta_pendirian || '',
      no_sk_kemenkumham: item.no_sk_kemenkumham || '',
      npwp: item.npwp || '',
      alamat: item.alamat || '',
      email: item.email || '',
      telepon: item.telepon || '',
      tanggal_berdiri: item.tanggal_berdiri || '',
      status: item.status || 'aktif',
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
        await api.put(`/yayasan/lembaga/${editing.id}`, form)
      } else {
        await api.post('/yayasan/lembaga', form)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.msg || 'Gagal menyimpan lembaga.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus lembaga "${item.nama_lembaga}"?`)) return
    try {
      await api.delete(`/yayasan/lembaga/${item.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus lembaga.')
    }
  }

  const columns = [
    { key: 'nama_lembaga', header: 'Nama Lembaga' },
    { key: 'email', header: 'Email' },
    { key: 'telepon', header: 'Telepon' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            row.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'divisi_count',
      header: 'Divisi',
      render: (row) => row.divisi_count ?? 0,
    },
    {
      key: 'pengurus_count',
      header: 'Pengurus',
      render: (row) => row.pengurus_count ?? 0,
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
          <h1 className="text-xl font-semibold text-slate-900">Lembaga</h1>
          <p className="text-sm text-slate-500">Kelola data lembaga/yayasan.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah Lembaga
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama lembaga..."
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyText="Belum ada lembaga" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Lembaga' : 'Tambah Lembaga'}
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
              form="lembaga-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="lembaga-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lembaga</label>
            <input
              type="text"
              required
              value={form.nama_lembaga}
              onChange={(e) => setForm({ ...form, nama_lembaga: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">No. Akta Pendirian</label>
              <input
                type="text"
                value={form.no_akta_pendirian}
                onChange={(e) => setForm({ ...form, no_akta_pendirian: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">No. SK Kemenkumham</label>
              <input
                type="text"
                value={form.no_sk_kemenkumham}
                onChange={(e) => setForm({ ...form, no_sk_kemenkumham: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">NPWP</label>
            <input
              type="text"
              value={form.npwp}
              onChange={(e) => setForm({ ...form, npwp: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Alamat</label>
            <textarea
              rows={2}
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telepon</label>
              <input
                type="text"
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Berdiri</label>
              <input
                type="date"
                value={form.tanggal_berdiri}
                onChange={(e) => setForm({ ...form, tanggal_berdiri: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
