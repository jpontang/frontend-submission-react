import { useEffect, useMemo, useState } from 'react'
import { Mail, Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import api from '../lib/api'

const EMPTY_FORM = { name: '', email: '', password: '', role_id: '', divisi_id: '' }

// Role yang cakupan aksesnya ditentukan oleh divisi yayasan (tbl_divisi),
// lihat migration add_divisi_yayasan_role_to_roles_table & UserController.
const DIVISI_YAYASAN_ROLE_ID = 107

export default function Users() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [divisiList, setDivisiList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [resendingId, setResendingId] = useState(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, rolesRes, divisiRes] = await Promise.all([
        api.get('/user'),
        api.get('/roles'),
        api.get('/yayasan/divisi'),
      ])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
      setDivisiList(divisiRes.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }, [users, search])

  function openAddModal() {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(user) {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role_id: user.role_id ?? '',
      divisi_id: user.role_id === DIVISI_YAYASAN_ROLE_ID ? user.id_subroles ?? '' : '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  const isDivisiYayasanRole = Number(form.role_id) === DIVISI_YAYASAN_ROLE_ID

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role_id: form.role_id,
      }
      if (isDivisiYayasanRole) payload.divisi_id = form.divisi_id || null
      if (form.password) payload.password = form.password

      if (editingUser) {
        await api.put(`/user/${editingUser.id}`, payload)
      } else {
        await api.post('/user', payload)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      const message = errors
        ? Object.values(errors)[0]?.[0]
        : err.response?.data?.msg || 'Gagal menyimpan user.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleResendVerification(user) {
    setResendingId(user.id)
    setNotice(null)
    setError(null)
    try {
      const { data } = await api.post(`/user/${user.id}/resend-verification`)
      setNotice(data.msg || 'Link verifikasi berhasil dikirim ulang.')
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengirim link verifikasi.')
    } finally {
      setResendingId(null)
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Hapus user "${user.name}"?`)) return
    try {
      await api.delete(`/user/${user.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus user.')
    }
  }

  const columns = [
    { key: 'name', header: 'Nama' },
    { key: 'email', header: 'Email' },
    {
      key: 'role_name',
      header: 'Role',
      render: (row) => row.role_name || <span className="text-slate-400">Belum ada role</span>,
    },
    {
      key: 'email_verified_at',
      header: 'Status Email',
      render: (row) =>
        row.email_verified_at ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Terverifikasi
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Belum verifikasi
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          {!row.email_verified_at && (
            <button
              onClick={() => handleResendVerification(row)}
              disabled={resendingId === row.id}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
            >
              <Mail size={14} />
              {resendingId === row.id ? 'Mengirim...' : 'Kirim Link Verifikasi'}
            </button>
          )}
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
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Kelola pengguna dan hak akses.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah User
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama atau email..."
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      {notice && <p className="text-sm text-emerald-600">{notice}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={filteredUsers} emptyText="Belum ada user" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Tambah User'}
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
              form="user-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {!editingUser && (
              <p className="mt-1 text-xs text-slate-400">
                Email verifikasi akan otomatis dikirim setelah user dibuat.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password {editingUser && <span className="text-slate-400">(kosongkan jika tidak diubah)</span>}
            </label>
            <input
              type="password"
              required={!editingUser}
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              required
              value={form.role_id}
              onChange={(e) =>
                setForm({ ...form, role_id: e.target.value, divisi_id: '' })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Pilih role
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>

          {isDivisiYayasanRole && (
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
                {divisiList.map((divisi) => (
                  <option key={divisi.id} value={divisi.id}>
                    {divisi.nama_divisi}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Akses user ini akan dibatasi ke divisi ini beserta seluruh sub-divisinya.
              </p>
            </div>
          )}

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
