import Modal from './Modal'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/**
 * Detail persentase SPP masuk per unit, dibuka dari tombol "Lihat Detail"
 * pada card "Total SPP Masuk" di BendaharaDashboard.
 * rows = [{ unit, masuk, total, percentage }]
 */
export default function SppUnitDetailModal({ open, onClose, periodLabel, rows }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Persentase Spp Masuk Tiap Unit (${periodLabel})`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Okay
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.length === 0 && (
          <p className="col-span-full text-center text-sm text-slate-400">Tidak ada data.</p>
        )}
        {rows.map((row) => (
          <div
            key={row.unit}
            className="rounded-lg border border-slate-200 border-l-4 border-l-indigo-600 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold uppercase text-blue-900">{row.unit}</span>
              <span className="whitespace-nowrap text-sm font-semibold text-cyan-500">
                {row.percentage}%
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${Math.min(Math.max(row.percentage, 0), 100)}%` }}
              />
            </div>

            <p className="mt-2 text-xs font-medium text-cyan-600">
              Spp Masuk: {formatRupiah(row.masuk)} | Total Spp: {formatRupiah(row.total)}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  )
}
