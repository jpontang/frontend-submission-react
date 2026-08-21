import { Plus, Trash2 } from 'lucide-react'

const EMPTY_ITEM = { uraian: '', qty: 1, satuan: '', keterangan: '', harga: '', ppn: 0 }

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function itemTotal(item) {
  const qty = Number(item.qty) || 0
  const harga = Number(item.harga) || 0
  const ppn = Number(item.ppn) || 0
  return qty * harga * (1 + ppn / 100)
}

/**
 * Baris item dinamis (uraian/qty/satuan/harga/ppn) dipakai bareng di form
 * buat pengajuan & form resubmit setelah revisi QC. Total per baris &
 * grand total dihitung client-side cuma utk preview - nilai final tetap
 * dihitung ulang server-side (qty x harga x (1+ppn%), lihat
 * PengajuanController::store()/resubmit()).
 */
export default function DetilPengajuanEditor({ items, onChange }) {
  function updateItem(index, field, value) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    onChange(next)
  }

  function addItem() {
    onChange([...items, { ...EMPTY_ITEM }])
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  const grandTotal = items.reduce((sum, item) => sum + itemTotal(item), 0)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 p-3">
            <input
              type="text"
              required
              placeholder="Uraian"
              value={item.uraian}
              onChange={(e) => updateItem(index, 'uraian', e.target.value)}
              className="col-span-12 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:col-span-4"
            />
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(index, 'qty', e.target.value)}
              className="col-span-4 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:col-span-2"
            />
            <input
              type="text"
              placeholder="Satuan"
              value={item.satuan}
              onChange={(e) => updateItem(index, 'satuan', e.target.value)}
              className="col-span-4 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:col-span-2"
            />
            <input
              type="number"
              min="0"
              placeholder="Harga satuan"
              value={item.harga}
              onChange={(e) => updateItem(index, 'harga', e.target.value)}
              className="col-span-4 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:col-span-3"
            />
            <input
              type="text"
              placeholder="Keterangan (opsional) - mis. spesifikasi/warna/merk"
              value={item.keterangan}
              onChange={(e) => updateItem(index, 'keterangan', e.target.value)}
              className="col-span-12 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <div className="col-span-10 flex items-center justify-between px-1 text-xs text-slate-500 sm:col-span-11">
              <span>PPN %:</span>
              <input
                type="number"
                min="0"
                value={item.ppn}
                onChange={(e) => updateItem(index, 'ppn', e.target.value)}
                className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs outline-none focus:border-indigo-500"
              />
              <span className="font-medium text-slate-700">{formatRupiah(itemTotal(item))}</span>
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
              className="col-span-2 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 sm:col-span-1"
              title="Hapus item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        <Plus size={14} />
        Tambah Item
      </button>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
        <span className="font-medium text-slate-600">Total Pengajuan</span>
        <span className="font-semibold text-slate-900">{formatRupiah(grandTotal)}</span>
      </div>
    </div>
  )
}

export { EMPTY_ITEM }
