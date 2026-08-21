import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import api from '../lib/api'

const EMPTY_FORM = {
  vendor: 'watzap',
  api_key: '',
  number_key: '',
  is_active: true,
}

/**
 * Menu Setting WhatsApp API (khusus Admin) - kredensial vendor pengirim
 * WhatsApp (lihat App\Http\Controllers\Broadcast\WhatsappController),
 * dipakai antara lain oleh tombol "Kirim via WhatsApp" di detail Pengajuan
 * (kirim PO ke supplier). Cuma satu baris yang boleh berstatus Aktif -
 * itu yang benar-benar dipakai saat kirim (lihat WhatsappSetting::active()
 * di backend), baris lain tersimpan sbg riwayat/cadangan.
 */
export default function WhatsappSetting() {
  const [items, setItems] = useState([])
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
      const { data } = await api.get('/whatsapp-setting')
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data setting WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openAddModal() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(item) {
    setEditing(item)
    setForm({
      vendor: item.vendor || 'watzap',
      api_key: item.api_key || '',
      number_key: item.number_key || '',
      is_active: Boolean(item.is_active),
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
        await api.put(`/whatsapp-setting/${editing.id}`, form)
      } else {
        await api.post('/whatsapp-setting', form)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.msg || 'Gagal menyimpan setting.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(item) {
    try {
      await api.post(`/whatsapp-setting/${item.id}/toggle-active`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengubah status aktif.')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus setting WhatsApp vendor "${item.vendor}" ini?`)) return
    try {
      await api.delete(`/whatsapp-setting/${item.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus setting.')
    }
  }

  function maskKey(value) {
    if (!value) return '-'
    if (value.length <= 8) return '••••••••'
    return `${value.slice(0, 4)}${'•'.repeat(8)}${value.slice(-4)}`
  }

  const columns = [
    {
      key: 'vendor',
      header: 'Vendor',
      render: (row) => <span className="font-medium capitalize text-slate-800">{row.vendor}</span>,
    },
    { key: 'api_key', header: 'API Key', render: (row) => <span className="font-mono text-xs">{maskKey(row.api_key)}</span> },
    { key: 'number_key', header: 'Number Key', render: (row) => <span className="font-mono text-xs">{maskKey(row.number_key)}</span> },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <button
          onClick={() => handleToggleActive(row)}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.is_active ? <CheckCircle2 size={13} /> : <Circle size={13} />}
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </button>
      ),
    },
    {
      key: 'updated_at',
      header: 'Diperbarui',
      render: (row) => (row.updated_at ? new Date(row.updated_at).toLocaleString('id-ID') : '-'),
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
          <h1 className="text-xl font-semibold text-slate-900">Setting WhatsApp API</h1>
          <p className="text-sm text-slate-500">
            Kredensial vendor pengirim WhatsApp - dipakai antara lain utk kirim PO ke supplier. Cuma
            satu setting yang boleh Aktif sekaligus.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={16} />
          Tambah Setting
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data...</p>
      ) : (
        <DataTable columns={columns} rows={items} emptyText="Belum ada setting WhatsApp." />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Setting WhatsApp' : 'Tambah Setting WhatsApp'}
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
              form="whatsapp-setting-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="whatsapp-setting-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Vendor</label>
            <select
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="watzap">WatzApp (watzap.id)</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">Baru WatzApp yang didukung sistem saat ini.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">API Key</label>
            <input
              type="text"
              required
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Number Key</label>
            <input
              type="text"
              value={form.number_key}
              onChange={(e) => setForm({ ...form, number_key: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Jadikan setting aktif (menonaktifkan setting lain yang sedang aktif)
          </label>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
