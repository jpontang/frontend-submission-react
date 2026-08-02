import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../config/navigation'
import api from '../lib/api'

const EMPTY_FORM = {
  nama_suplayer: '',
  nama_direktur: '',
  jabatan: '',
  kontak_suplayer: '',
  alamat_suplayer: '',
  email_suplayer: '',
  admin_suplayer: '',
  kontak_admin: '',
}

/**
 * Direktori Suplayer - CRUD (khusus Admin, dijaga backend lewat middleware
 * 'admin' di routes/api.php utk create/update/delete; index/show boleh
 * dibaca siapa saja yg login). Role Suplayer lihat daftar ini read-only
 * (tanpa tombol kelola).
 */
export default function Suplayer() {
  const { roleId } = useAuth()
  const isAdmin = Number(roleId) === ROLES.ADMIN

  const [list, setList] = useState([])
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
      const { data } = await api.get('/suplayer')
      setList(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data suplayer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      nama_suplayer: row.nama_suplayer || '',
      nama_direktur: row.nama_direktur || '',
      jabatan: row.jabatan || '',
      kontak_suplayer: row.kontak_suplayer || '',
      alamat_suplayer: row.alamat_suplayer || '',
      email_suplayer: row.email_suplayer || '',
      admin_suplayer: row.admin_suplayer || '',
      kontak_admin: row.kontak_admin || '',
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
        await api.put(`/suplayer/${editing.id}`, form)
      } else {
        await api.post('/suplayer', form)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Gagal menyimpan suplayer.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus suplayer "${row.nama_suplayer}"?`)) return
    setError(null)
    try {
      await api.delete(`/suplayer/${row.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus suplayer.')
    }
  }

  const columns = [
    { key: 'kode_suplayer', header: 'Kode' },
    { key: 'nama_suplayer', header: 'Nama Suplayer' },
    { key: 'nama_direktur', header: 'Direktur', render: (row) => row.nama_direktur || '-' },
    { key: 'kontak_suplayer', header: 'Kontak', render: (row) => row.kontak_suplayer || '-' },
    { key: 'email_suplayer', header: 'Email', render: (row) => row.email_suplayer || '-' },
    { key: 'alamat_suplayer', header: 'Alamat', render: (row) => row.alamat_suplayer || '-' },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'Aksi',
            render: (row) => (
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
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Suplayer</h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? 'Kelola direktori suplayer.' : 'Daftar suplayer terdaftar.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} />
            Tambah Suplayer
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <DataTable
        columns={columns}
        rows={list}
        emptyText={loading ? 'Memuat data...' : 'Belum ada suplayer.'}
      />

      {isAdmin && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Edit Suplayer' : 'Tambah Suplayer'}
          size="lg"
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
                form="suplayer-form"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </>
          }
        >
          <form id="suplayer-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama Suplayer</label>
                <input
                  type="text"
                  required
                  value={form.nama_suplayer}
                  onChange={(e) => setForm({ ...form, nama_suplayer: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={form.email_suplayer}
                  onChange={(e) => setForm({ ...form, email_suplayer: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Alamat</label>
              <input
                type="text"
                required
                value={form.alamat_suplayer}
                onChange={(e) => setForm({ ...form, alamat_suplayer: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kontak Suplayer</label>
                <input
                  type="text"
                  required
                  value={form.kontak_suplayer}
                  onChange={(e) => setForm({ ...form, kontak_suplayer: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama Direktur</label>
                <input
                  type="text"
                  value={form.nama_direktur}
                  onChange={(e) => setForm({ ...form, nama_direktur: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Jabatan Direktur</label>
                <input
                  type="text"
                  value={form.jabatan}
                  onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama Admin/PIC</label>
                <input
                  type="text"
                  value={form.admin_suplayer}
                  onChange={(e) => setForm({ ...form, admin_suplayer: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kontak Admin/PIC</label>
                <input
                  type="text"
                  value={form.kontak_admin}
                  onChange={(e) => setForm({ ...form, kontak_admin: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-rose-600">{formError}</p>}
          </form>
        </Modal>
      )}
    </div>
  )
}
