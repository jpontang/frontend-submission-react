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
  Banknote,
  TrendingDown,
  History,
  CircleCheck,
  HandCoins,
  MessageCircle,
} from 'lucide-react'

export const ROLES = {
  ADMIN: 101,
  BENDAHARA: 102,
  UNIT_SEKOLAH: 103,
  QC: 104,
  SUPLAYER: 105,
  UNIT_DEPARTEMEN: 106,
  DIVISI_YAYASAN: 107,
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.BENDAHARA]: 'Bendahara',
  [ROLES.UNIT_SEKOLAH]: 'Unit Sekolah',
  [ROLES.QC]: 'QC',
  [ROLES.SUPLAYER]: 'Suplayer',
  [ROLES.UNIT_DEPARTEMEN]: 'Unit Departemen',
  [ROLES.DIVISI_YAYASAN]: 'Divisi Yayasan',
}

// roles: undefined artinya menu tampil untuk semua role yang sudah login.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
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
    to: '/yayasan/pengajuan',
    label: 'Pengajuan',
    icon: FileText,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA, ROLES.QC, ROLES.DIVISI_YAYASAN],
  },
  {
    to: '/yayasan/peminjaman',
    label: 'Peminjaman',
    icon: HandCoins,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA, ROLES.QC, ROLES.DIVISI_YAYASAN],
  },
  {
    to: '/yayasan/kas-transaksi',
    label: 'Kas Transaksi',
    icon: Banknote,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA, ROLES.DIVISI_YAYASAN],
  },
  {
    to: '/yayasan/potongan-pendapatan',
    label: 'Potongan Pendapatan',
    icon: TrendingDown,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA],
  },
  {
    to: '/qc-review',
    label: 'QC Review',
    icon: ClipboardCheck,
    roles: [ROLES.ADMIN, ROLES.QC],
  },
  {
    to: '/bendahara-review',
    label: 'Approval Bendahara',
    icon: CircleCheck,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA],
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
      { to: '/yayasan/kas-transaksi-yayasan', label: 'Kas Transaksi Yayasan' },
    ],
  },
  {
    label: 'Log',
    icon: History,
    roles: [ROLES.ADMIN],
    children: [
      { to: '/yayasan/cron-log', label: 'Log Cron' },
      { to: '/yayasan/rekap-kas-bulanan', label: 'Rekap Kas Bulanan' },
    ],
  },
  {
    to: '/whatsapp-log',
    label: 'Log WhatsApp',
    icon: MessageCircle,
    roles: [ROLES.ADMIN, ROLES.BENDAHARA],
  },
  {
    label: 'Settings',
    icon: Settings,
    // 'Profil Akun' tampil ke semua role (item.roles kosong = semua role
    // yg sudah login), 'WhatsApp API' dibatasi Admin lewat `roles` di child
    // ini sendiri (lihat getNavItemsForRole - beda dari grup Yayasan/Log yg
    // pembatasannya cuma di level grup, krn semua childnya memang admin-only).
    children: [
      { to: '/settings', label: 'Profil Akun' },
      { to: '/whatsapp-setting', label: 'WhatsApp API', roles: [ROLES.ADMIN] },
    ],
  },
]

export function getNavItemsForRole(roleId) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(Number(roleId)))
    .map((item) =>
      item.children
        ? { ...item, children: item.children.filter((child) => !child.roles || child.roles.includes(Number(roleId))) }
        : item
    )
    .filter((item) => !item.children || item.children.length > 0)
}

// Dipakai UserLayout utk set document.title otomatis sesuai menu yang lagi
// dibuka, tanpa perlu tambah kode di tiap halaman satu-satu.
export function getPageTitle(pathname) {
  const flat = NAV_ITEMS.flatMap((item) => (item.children ? item.children : [item]))
  const match = flat.find((item) => item.to === pathname)
  return match?.label || 'Admin Panel'
}
