import Modal from './Modal'

/**
 * Breakdown jumlah siswa aktif per kelas untuk satu unit terpilih,
 * dibuka dari SiswaUnitDetailModal (drill-down).
 * rows = [{ kelas, total }] (dari siswaKelas, sudah difilter per unit)
 */
export default function SiswaKelasDetailModal({ open, onClose, onBack, unitName, rows }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Jumlah Siswa Aktif per Kelas - ${unitName}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            &larr; Kembali
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Okay
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.length === 0 && (
          <p className="col-span-full text-center text-sm text-slate-400">Tidak ada data.</p>
        )}
        {rows.map((row) => (
          <div
            key={row.kelas}
            className="rounded-lg border border-slate-200 border-l-4 border-l-indigo-600 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold uppercase text-blue-900">{row.kelas}</span>
              <span className="whitespace-nowrap text-sm font-semibold text-cyan-500">
                {row.total} siswa
              </span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
