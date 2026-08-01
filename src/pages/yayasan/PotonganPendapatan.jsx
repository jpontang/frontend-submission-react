import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import api from '../../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function currentPeriode() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatPeriode(value) {
  if (!value) return '-'
  const [year, month] = value.slice(0, 7).split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

function EMPTY_FORM_FACTORY() {
  return { divisi_id: '', periode: currentPeriode(), uraian: '', besaran: '' }
}

/**
 * Potongan Pendapatan - khusus Bendahara & Admin (dicek di backend lewat
 * DeductionIncomeController, bukan cuma disembunyikan di menu). Beda dari
 * tabel deduction_incomes lama (main db, kode_unit -> unit_sekolahs/
 * divisions lama), ini di-scope ke tbl_divisi (divisi_id) supaya SETIAP
 * divisi - baik parent/root maupun anak - bisa dicatat potongan
 * pendapatannya sendiri, dibedakan lewat kode_divisi. Dipakai sbg
 * komponen "Potong Pendapatan" di AlokasiBudgetModal saat Set Budget.
 */
export default function PotonganPendapatan() {
  const [list, setList] = useState([])
  const [divisiList, setDivisiList] = useState([])
  const [periodeFilter, setPeriodeFilter] = useState(currentPeriode())
  const [parentFilter, setParentFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const parentOptions = divisiList.filter((d) => !d.parent_divisi_id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM_FACTORY())
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/yayasan/deduction-income', {
        params: {
          ...(periodeFilter ? { periode: periodeFilter } : {}),
          ...(parentFilter ? { parent_id: parentFilter } : {}),
        },
      })
      setList(data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal memuat data potongan pendapatan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodeFilter, parentFilter])

  useEffect(() => {
    api
      .get('/yayasan/divisi')
      .then(({ data }) => setDivisiList(data))
      .catch(() => {})
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM_FACTORY())
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      divisi_id: row.divisi_id,
      periode: row.periode ? row.periode.slice(0, 7) : currentPeriode(),
      uraian: row.uraian,
      besaran: row.besaran,
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
        await api.put(`/yayasan/deduction-income/${editing.id}`, {
          periode: form.periode,
          uraian: form.uraian,
          besaran: form.besaran,
        })
      } else {
        await api.post('/yayasan/deduction-income', form)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus potongan pendapatan "${row.uraian}"?`)) return
    setError(null)
    try {
      await api.delete(`/yayasan/deduction-income/${row.id}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menghapus.')
    }
  }

  const columns = [
    {
      key: 'divisi',
      header: 'Divisi',
      render: (row) => (
        <span>
          {row.divisi?.nama_divisi || '-'} <span className="text-xs text-slate-400">({row.kode_divisi})</span>
          {row.parent_divisi?.nama_divisi && (
            <span className="mt-0.5 block text-xs text-slate-400">Induk: {row.parent_divisi.nama_divisi}</span>
          )}
        </span>
      ),
    },
    {
      key: 'periode',
      header: 'Periode',
      render: (row) => (
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          {formatPeriode(row.periode)}
        </span>
      ),
    },
    { key: 'uraian', header: 'Uraian' },
    { key: 'besaran', header: 'Besaran', render: (row) => formatRupiah(row.besaran) },
    { key: 'petugas', header: 'Petugas' },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Potongan Pendapatan</h1>
          <p className="text-sm text-slate-500">
            Potongan pendapatan per divisi (parent maupun anak), jadi komponen pengurang saat
            Alokasi Budget.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua Parent Divisi</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama_divisi} ({d.kode_divisi})
              </option>
            ))}
          </select>
          <input
            type="month"
            value={periodeFilter}
            onChange={(e) => setPeriodeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} />
            Tambah Potongan
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <DataTable
        columns={columns}
        rows={list}
        emptyText={loading ? 'Memuat data...' : 'Belum ada potongan pendapatan.'}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Potongan Pendapatan' : 'Tambah Potongan Pendapatan'}
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
              form="potongan-form"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form id="potongan-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Divisi / Parent Divisi
            </label>
            <select
              required
              disabled={Boolean(editing)}
              value={form.divisi_id}
              onChange={(e) => setForm({ ...form, divisi_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
            >
              <option value="" disabled>
                Pilih divisi
              </option>
              {divisiList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.parent_divisi_id ? `— ${d.nama_divisi}` : d.nama_divisi} ({d.kode_divisi})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Periode</label>
            <input
              type="month"
              required
              value={form.periode}
              onChange={(e) => setForm({ ...form, periode: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              Potongan bersifat bulanan - hanya berlaku utk bulan yang dipilih.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Uraian</label>
            <input
              type="text"
              required
              value={form.uraian}
              onChange={(e) => setForm({ ...form, uraian: e.target.value })}
              placeholder="Contoh: Honor staff"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Besaran</label>
            <input
              type="number"
              required
              min="0"
              value={form.besaran}
              onChange={(e) => setForm({ ...form, besaran: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  )
}
