import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { getNavItemsForRole, ROLE_LABELS } from '../config/navigation'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ open, onClose }) {
  const { roleId } = useAuth()
  const navItems = getNavItemsForRole(roleId)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-100 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-white">
            Panel<span className="text-indigo-400">Pengajuan</span>
          </span>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {roleId && (
          <div className="px-6 pb-2">
            <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-indigo-300">
              {ROLE_LABELS[roleId] || 'User'}
            </span>
          </div>
        )}

        <nav className="mt-2 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
