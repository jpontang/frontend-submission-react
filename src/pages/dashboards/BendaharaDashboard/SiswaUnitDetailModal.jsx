import Modal from './Modal'

/**
 * Daftar jumlah siswa aktif per unit, dibuka dari tombol "Lihat Detail"
 * pada card "Total Siswa Aktif" di BendaharaDashboard.
 * rows = [{ kode_unit, nama_unit, total }] (dari allSiswaUnit)
 * Klik salah satu unit membuka SiswaKelasDetailModal (breakdown per kelas).
 */
export default function SiswaUnitDetailModal({ open, onClose, periodLabel, rows, onSelectUnit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Jumlah Siswa Aktif Tiap Unit (${periodLabel})`}
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
          <button
            key={row.kode_unit}
            type="button"
            onClick={() => onSelectUnit(row)}
            className="rounded-lg border border-slate-200 border-l-4 border-l-indigo-600 bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold uppercase text-blue-900">{row.nama_unit}</span>
              <span className="whitespace-nowrap text-sm font-semibold text-cyan-500">
                {row.total} siswa
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-blue-600">Lihat detail per kelas &rarr;</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}
