import clsx from 'clsx'

/**
 * Kartu ringkasan angka untuk dashboard (mis. total pengajuan, total user).
 * trend > 0 ditampilkan hijau naik, trend < 0 merah turun.
 */
export default function StatCard({ label, value, icon: Icon, trend, accent = 'indigo' }) {
  const accentMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {Icon && (
          <span className={clsx('rounded-lg p-2', accentMap[accent])}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        {typeof trend === 'number' && (
          <span
            className={clsx(
              'text-xs font-semibold',
              trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </div>
  )
}
