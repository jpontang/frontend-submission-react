import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import api from '../../lib/api'

const EMPTY_FORM = {
  lembaga_id: '',
  divisi_id: '',
  jabatan_id: '',
  user_id: '',
  nik: '',
  nama_lengkap: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  alamat: '',
  no_hp: '',
  email: '',
  tanggal_bergabung: '',
  tanggal_keluar: '',
  status: 'aktif',
}

export default function Pengurus() {
  const [items, setItems] = useState([])
  const [lembagaList, setLembagaList] = useState([])
  const [divisiList, setDivisiList] = useState([])
  const [jabatanList, setJabatanList] = useState([])
  const [userList, setUserList] = useState([])
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
      const [pengurusRes, lembagaRes, divisiRes, jabatanRes, userRes] = await Promise.all([
        api.get('/yayasan/pengurus'),
        api.get('/yayasan/lembaga'),
        api.get('/yayasan/divisi'),
        api.get('/yayasan/jabatan'),
        api.get('/user'),
      ])
      setItems(pengurusRes.data)
      setLembagaList(lembagaRes.data)
      setDivisiList(divisiRes.data)
      setJabatanList(jabatanRes.data)
      setUserList(userRes.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data pengurus.')
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
    return items.filter(
      (item) =>
        item.nama_lengkap?.toLowerCase().includes(q) || item.nik?.toLowerCase().includes(q)
    )
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
      divisi_id: item.divisi_id ?? '',
      jabatan_id: item.jabatan_id ?? '',
      user_id: item.user_id ?? '',
      nik: item.nik || '',
      nama_lengkap: item.nama_lengkap || '',
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir || '',
      jenis_kelamin: item.jenis_kelamin || '',
      alamat: item.alamat || '',
      no_hp: item.no_hp || '',
      email: item.email || '',
      tanggal_bergabung: item.tanggal_bergabung || '',
      tanggal_keluar: item.tanggal_keluar || '',
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
        divisi_id: form.divisi_id || null,
        jabatan_id: form.jabatan_id || null,
        user_id: form.user_id || null,
        tanggal_keluar: form.tanggal_keluar || null,
      }
      if (editing) {
        await api.put(`/yayasan/pengurus/${editing.id}`, payload)
      } else {
        await api.post('/yayasan/pengurus', payload)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.msg || 'Gagal menyimpan pengurus.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus pengurus "${item.nama_lengkap}"?`)) return
    try {
      await api.delete(`/yayasan/pengurus/${item.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus pengurus.')
    }
  }

  const statusBadge = {
    aktif: 'bg-emerald-50 text-emerald-700',
    nonaktif: 'bg-slate-100 text-slate-500',
    pensiun: 'bg-amber-50 text-amber-700',
  }

  const columns = [
    { key: 'nama_lengkap', header: 'Nama Lengkap' },
    { key: 'nik', header: 'NIK' },
    { key: 'jabatan', header: 'Jabatan', render: (row) => row.jabatan?.nama_jabatan || '-' },
    { key: 'divisi', header: 'Divisi', render: (row) => row.divisi?.nama_divisi || '-' },
    {
      key: 'user',
      header: 'Akun Login',
      render: (row) =>
        row.user ? (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            {row.user.email}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[row.status] || 'bg-slate-100 text-slate-500'}`}>
          {row.status}
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
          <h1 className="text-xl font-semibold text-slate-900">Pengurus</h1>
          <p className="text-sm text-slate-500">Kelola data pengurus yayasan.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah Pengurus
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama atau NIK..."
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyText="Belum ada pengurus" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Pengurus' : 'Tambah Pengurus'}
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
              form="pengurus-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="pengurus-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Divisi</label>
              <select
                value={form.divisi_id}
                onChange={(e) => setForm({ ...form, divisi_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Tidak ada</option>
                {divisiList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_divisi}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jabatan</label>
              <select
                value={form.jabatan_id}
                onChange={(e) => setForm({ ...form, jabatan_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Tidak ada</option>
                {jabatanList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama_jabatan}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Akun Login Terhubung</label>
              <select
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Tidak terhubung</option>
                {userList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">NIK</label>
              <input
                type="text"
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
              <input
                type="text"
                required
                value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tempat Lahir</label>
              <input
                type="text"
                value={form.tempat_lahir}
                onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Lahir</label>
              <input
                type="date"
                value={form.tanggal_lahir}
                onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Kelamin</label>
              <select
                value={form.jenis_kelamin}
                onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">No. HP</label>
              <input
                type="text"
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Bergabung</label>
              <input
                type="date"
                value={form.tanggal_bergabung}
                onChange={(e) => setForm({ ...form, tanggal_bergabung: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Keluar</label>
              <input
                type="date"
                value={form.tanggal_keluar}
                onChange={(e) => setForm({ ...form, tanggal_keluar: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
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
              <option value="pensiun">Pensiun</option>
            </select>
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
