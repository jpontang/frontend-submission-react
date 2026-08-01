import { X } from 'lucide-react'

const SIZES = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Modal generik: overlay + dialog dengan header (judul + tombol close),
 * body (children), dan footer opsional (mis. tombol Simpan/Batal).
 * size: 'md' (default, dialog form biasa), 'lg'/'xl' utk form yang lebih
 * lebar (mis. ada beberapa kolom sekaligus / tabel item dinamis).
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        className={`flex max-h-[85vh] w-full ${SIZES[size] || SIZES.md} flex-col overflow-hidden rounded-xl bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}
