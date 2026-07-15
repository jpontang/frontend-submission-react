import { ArrowRight } from 'lucide-react'

/**
 * Kartu info dengan judul + periode, nilai besar, dan link "Lihat Detail".
 * Pojok kanan atas menampilkan ikon ATAU persentase (pilih salah satu).
 */
export default function InfoStatCard({ title, period, value, icon: Icon, percentage, onDetailClick }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-blue-900">{title}</h3>
          {period && <p className="text-xs font-semibold text-orange-500">({period})</p>}
        </div>
        {typeof percentage === 'number' ? (
          <span className="text-sm font-semibold text-cyan-500">{percentage}%</span>
        ) : (
          Icon && <Icon size={28} className="text-slate-300" />
        )}
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onDetailClick}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Lihat Detail
        </button>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
          <ArrowRight size={14} />
        </span>
      </div>
    </div>
  )
}
