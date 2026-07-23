import { useEffect, useMemo, useState } from 'react'
import { LayoutList, Network, Pencil, Plus, Trash2, Workflow } from 'lucide-react'
import DataTable from '../../components/DataTable'
import DivisiOrgChart from '../../components/DivisiOrgChart'
import DivisiTree from '../../components/DivisiTree'
import Modal from '../../components/Modal'
import api from '../../lib/api'

const EMPTY_FORM = {
  lembaga_id: '',
  parent_divisi_id: '',
  kode_divisi: '',
  nama_divisi: '',
  deskripsi: '',
  kepala_divisi_id: '',
  status: 'aktif',
}

export default function Divisi() {
  const [items, setItems] = useState([])
  const [lembagaList, setLembagaList] = useState([])
  const [pengurusList, setPengurusList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('table')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [divisiRes, lembagaRes, pengurusRes] = await Promise.all([
        api.get('/yayasan/divisi'),
        api.get('/yayasan/lembaga'),
        api.get('/yayasan/pengurus'),
      ])
      setItems(divisiRes.data)
      setLembagaList(lembagaRes.data)
      setPengurusList(pengurusRes.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data divisi.')
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
    return items.filter((item) => item.nama_divisi?.toLowerCase().includes(q))
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
      parent_divisi_id: item.parent_divisi_id ?? '',
      kode_divisi: item.kode_divisi || '',
      nama_divisi: item.nama_divisi || '',
      deskripsi: item.deskripsi || '',
      kepala_divisi_id: item.kepala_divisi_id ?? '',
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
      const payload = {
        ...form,
        parent_divisi_id: form.parent_divisi_id || null,
        kepala_divisi_id: form.kepala_divisi_id || null,
      }
      if (editing) {
        await api.put(`/yayasan/divisi/${editing.id}`, payload)
      } else {
        await api.post('/yayasan/divisi', payload)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.msg || 'Gagal menyimpan divisi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus divisi "${item.nama_divisi}"?`)) return
    try {
      await api.delete(`/yayasan/divisi/${item.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus divisi.')
    }
  }

  const columns = [
    { key: 'nama_divisi', header: 'Nama Divisi' },
    { key: 'kode_divisi', header: 'Kode' },
    { key: 'lembaga', header: 'Lembaga', render: (row) => row.lembaga?.nama_lembaga || '-' },
    { key: 'parent', header: 'Induk Divisi', render: (row) => row.parent?.nama_divisi || '-' },
    {
      key: 'kode_parent',
      header: 'Kode Parent',
      render: (row) =>
        row.kode_parent ? (
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
            {row.kode_parent}
          </span>
        ) : (
          '-'
        ),
    },
    { key: 'kepala', header: 'Kepala Divisi', render: (row) => row.kepala?.nama_lengkap || '-' },
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
          <h1 className="text-xl font-semibold text-slate-900">Divisi</h1>
          <p className="text-sm text-slate-500">Kelola struktur divisi/unit organisasi.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah Divisi
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama divisi..."
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />

        <div className="flex shrink-0 rounded-lg border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => setView('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              view === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutList size={14} />
            Tabel
          </button>
          <button
            type="button"
            onClick={() => setView('tree')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              view === 'tree' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Network size={14} />
            Tree
          </button>
          <button
            type="button"
            onClick={() => setView('chart')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              view === 'chart' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Workflow size={14} />
            Org Chart
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : view === 'table' ? (
        <DataTable columns={columns} rows={filtered} emptyText="Belum ada divisi" />
      ) : view === 'tree' ? (
        <DivisiTree
          items={filtered}
          lembagaList={lembagaList}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      ) : (
        <DivisiOrgChart
          items={filtered}
          lembagaList={lembagaList}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Divisi' : 'Tambah Divisi'}
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
              form="divisi-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="divisi-form" onSubmit={handleSubmit} className="space-y-4">
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Kode Divisi</label>
              <input
                type="text"
                value={form.kode_divisi}
                onChange={(e) => setForm({ ...form, kode_divisi: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama Divisi</label>
              <input
                type="text"
                required
                value={form.nama_divisi}
                onChange={(e) => setForm({ ...form, nama_divisi: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Induk Divisi</label>
            <select
              value={form.parent_divisi_id}
              onChange={(e) => setForm({ ...form, parent_divisi_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Tidak ada (divisi utama)</option>
              {items
                .filter((d) => !editing || d.id !== editing.id)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_divisi}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kepala Divisi</label>
            <select
              value={form.kepala_divisi_id}
              onChange={(e) => setForm({ ...form, kepala_divisi_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Belum ditentukan</option>
              {pengurusList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_lengkap}
                </option>
              ))}
            </select>
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

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
