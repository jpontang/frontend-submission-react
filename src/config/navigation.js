import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Wallet,
  ClipboardCheck,
  Truck,
  Receipt,
  ShieldCheck,
  Landmark,
} from 'lucide-react'

export const ROLES = {
  ADMIN: 101,
  BENDAHARA: 102,
  UNIT_SEKOLAH: 103,
  QC: 104,
  SUPLAYER: 105,
  UNIT_DEPARTEMEN: 106,
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.BENDAHARA]: 'Bendahara',
  [ROLES.UNIT_SEKOLAH]: 'Unit Sekolah',
  [ROLES.QC]: 'QC',
  [ROLES.SUPLAYER]: 'Suplayer',
  [ROLES.UNIT_DEPARTEMEN]: 'Unit Departemen',
}

// roles: undefined artinya menu tampil untuk semua role yang sudah login.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pengajuan', label: 'Pengajuan', icon: FileText },
  {
    to: '/budget-control',
    label: 'Budget Control',
    icon: Wallet,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA],
  },
  {
    to: '/penerimaan',
    label: 'Penerimaan',
    icon: Receipt,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA],
  },
  {
    to: '/qc-review',
    label: 'QC Review',
    icon: ClipboardCheck,
    roles: [ROLES.ADMIN, ROLES.QC],
  },
  {
    to: '/suplayer',
    label: 'Suplayer',
    icon: Truck,
    roles: [ROLES.ADMIN, ROLES.SUPLAYER],
  },
  {
    to: '/users',
    label: 'Users',
    icon: Users,
    roles: [ROLES.ADMIN],
  },
  {
    to: '/roles',
    label: 'Roles',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Yayasan',
    icon: Landmark,
    roles: [ROLES.ADMIN],
    children: [
      { to: '/yayasan/lembaga', label: 'Lembaga' },
      { to: '/yayasan/jabatan', label: 'Jabatan' },
      { to: '/yayasan/divisi', label: 'Divisi' },
      { to: '/yayasan/pengurus', label: 'Pengurus' },
      { to: '/yayasan/aset', label: 'Aset' },
      { to: '/yayasan/dokumen', label: 'Dokumen' },
    ],
  },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function getNavItemsForRole(roleId) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(Number(roleId)))
}
