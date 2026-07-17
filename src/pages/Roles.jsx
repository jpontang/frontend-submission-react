import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import api from '../lib/api'

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [roleName, setRoleName] = useState('')
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadRoles() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/roles')
      setRoles(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data roles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles
    return roles.filter((role) => role.role_name?.toLowerCase().includes(q))
  }, [roles, search])

  function openAddModal() {
    setEditingRole(null)
    setRoleName('')
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(role) {
    setEditingRole(role)
    setRoleName(role.role_name)
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, { role_name: roleName })
      } else {
        await api.post('/roles', { role_name: roleName })
      }
      setModalOpen(false)
      await loadRoles()
    } catch (err) {
      const message =
        err.response?.data?.errors?.role_name?.[0] ||
        err.response?.data?.msg ||
        'Gagal menyimpan role.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(role) {
    if (!window.confirm(`Hapus role "${role.role_name}"?`)) return
    try {
      await api.delete(`/roles/${role.id}`)
      await loadRoles()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus role.')
    }
  }

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'role_name', header: 'Nama Role' },
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
          <h1 className="text-xl font-semibold text-slate-900">Roles</h1>
          <p className="text-sm text-slate-500">Kelola daftar role pengguna.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah Role
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari role..."
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={filteredRoles} emptyText="Belum ada role" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Tambah Role'}
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
              form="role-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Role</label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Contoh: Admin"
            />
          </div>
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
