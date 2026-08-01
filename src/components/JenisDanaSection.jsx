import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import api from '../lib/api'

/**
 * CRUD jenis/sumber dana (tabel kode_dana) - khusus admin, ditaruh di
 * Settings. Dipakai sbg pilihan "Sumber Dana" saat mengajukan pengajuan
 * (lihat PengajuanFormModal). Hapus ditolak backend kalau jenis dana itu
 * masih dirujuk pengajuan manapun (lama maupun baru) - lihat
 * KodeDanaController::destroy().
 */
export default function JenisDanaSection() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/kode-dana')
      setList(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat jenis dana.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openAdd() {
    setEditing(null)
    setName('')
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setName(row.name)
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await api.put(`/kode-dana/${editing.id}`, { name })
      } else {
        await api.post('/kode-dana', { name })
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const message =
        err.response?.data?.errors?.name?.[0] || err.response?.data?.msg || 'Gagal menyimpan.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus jenis dana "${row.name}"?`)) return
    setError(null)
    try {
      await api.delete(`/kode-dana/${row.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus jenis dana.')
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Jenis Dana</h2>
          <p className="text-sm text-slate-500">
            Sumber dana yang bisa dipilih saat mengajukan pengajuan (mis. Yayasan, BOS/BOP).
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={14} />
          Tambah
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada jenis dana.</p>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
          {list.map((row) => (
            <div key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-800">{row.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(row)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(row)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Jenis Dana' : 'Tambah Jenis Dana'}
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
              form="jenis-dana-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="jenis-dana-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Jenis Dana</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Contoh: Donatur"
            />
          </div>
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
