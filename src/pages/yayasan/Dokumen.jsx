import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import api from '../../lib/api'

const EMPTY_FORM = {
  lembaga_id: '',
  referensi_tabel: '',
  referensi_id: '',
  jenis_dokumen: '',
}

const REFERENSI_OPTIONS = [
  { value: '', label: 'Tidak terkait record tertentu' },
  { value: 'tbl_lembaga', label: 'Lembaga' },
  { value: 'tbl_divisi', label: 'Divisi' },
  { value: 'tbl_pengurus', label: 'Pengurus' },
  { value: 'tbl_aset', label: 'Aset' },
]

export default function Dokumen() {
  const [items, setItems] = useState([])
  const [lembagaList, setLembagaList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [dokumenRes, lembagaRes] = await Promise.all([
        api.get('/yayasan/dokumen'),
        api.get('/yayasan/lembaga'),
      ])
      setItems(dokumenRes.data)
      setLembagaList(lembagaRes.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data dokumen.')
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
    return items.filter((item) => item.nama_file?.toLowerCase().includes(q))
  }, [items, search])

  function openAddModal() {
    setForm(EMPTY_FORM)
    setFile(null)
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setFormError('Pilih file terlebih dahulu.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = new FormData()
      payload.append('lembaga_id', form.lembaga_id)
      if (form.referensi_tabel) payload.append('referensi_tabel', form.referensi_tabel)
      if (form.referensi_id) payload.append('referensi_id', form.referensi_id)
      if (form.jenis_dokumen) payload.append('jenis_dokumen', form.jenis_dokumen)
      payload.append('file', file)

      await api.post('/yayasan/dokumen', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.msg || 'Gagal mengunggah dokumen.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus dokumen "${item.nama_file}"?`)) return
    try {
      await api.delete(`/yayasan/dokumen/${item.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus dokumen.')
    }
  }

  const columns = [
    { key: 'nama_file', header: 'Nama File' },
    { key: 'jenis_dokumen', header: 'Jenis Dokumen' },
    { key: 'lembaga', header: 'Lembaga', render: (row) => row.lembaga?.nama_lembaga || '-' },
    {
      key: 'referensi',
      header: 'Terkait',
      render: (row) =>
        row.referensi_tabel ? (
          <span className="text-xs text-slate-500">
            {REFERENSI_OPTIONS.find((o) => o.value === row.referensi_tabel)?.label || row.referensi_tabel} #
            {row.referensi_id}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'uploaded_at',
      header: 'Diunggah',
      render: (row) => (row.uploaded_at ? new Date(row.uploaded_at).toLocaleString('id-ID') : '-'),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => handleDelete(row)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
        >
          <Trash2 size={14} />
          Hapus
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dokumen</h1>
          <p className="text-sm text-slate-500">Kelola dokumen pendukung lembaga/pengurus/aset.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Unggah Dokumen
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama file..."
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyText="Belum ada dokumen" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Unggah Dokumen"
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
              form="dokumen-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Mengunggah...' : 'Unggah'}
            </button>
          </>
        }
      >
        <form id="dokumen-form" onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Dokumen</label>
            <input
              type="text"
              value={form.jenis_dokumen}
              onChange={(e) => setForm({ ...form, jenis_dokumen: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Contoh: Akta Pendirian, KTP Pengurus"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Terkait Data</label>
              <select
                value={form.referensi_tabel}
                onChange={(e) => setForm({ ...form, referensi_tabel: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {REFERENSI_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ID Record</label>
              <input
                type="number"
                disabled={!form.referensi_tabel}
                value={form.referensi_id}
                onChange={(e) => setForm({ ...form, referensi_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">File</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">Maksimal 5 MB.</p>
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
