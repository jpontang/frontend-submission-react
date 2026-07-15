import clsx from 'clsx'

const STYLES = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  inactive: 'bg-slate-100 text-slate-600',
  rejected: 'bg-rose-50 text-rose-700',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        STYLES[status] || STYLES.inactive
      )}
    >
      {status}
    </span>
  )
}
