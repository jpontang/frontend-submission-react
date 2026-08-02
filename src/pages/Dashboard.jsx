import { useAuth } from '../context/AuthContext'
import { ROLES } from '../config/navigation'
import AdminDashboard from './dashboards/AdminDashboard'
import BendaharaDashboard from './dashboards/BendaharaDashboard'
import QCDashboard from './dashboards/QCDashboard'
import UnitDashboard from './dashboards/UnitDashboard'
import SuplayerDashboard from './dashboards/SuplayerDashboard'
import DivisiYayasanDashboard from './dashboards/DivisiYayasanDashboard'

const DASHBOARD_BY_ROLE = {
  [ROLES.ADMIN]: AdminDashboard,
  [ROLES.BENDAHARA]: BendaharaDashboard,
  [ROLES.QC]: QCDashboard,
  [ROLES.UNIT_SEKOLAH]: UnitDashboard,
  [ROLES.UNIT_DEPARTEMEN]: UnitDashboard,
  [ROLES.SUPLAYER]: SuplayerDashboard,
  [ROLES.DIVISI_YAYASAN]: DivisiYayasanDashboard,
}

/**
 * Dispatcher: render dashboard sesuai role_id user yang sedang login.
 * Fallback ke AdminDashboard kalau role tidak dikenali.
 */
export default function Dashboard() {
  const { roleId } = useAuth()
  const RoleDashboard = DASHBOARD_BY_ROLE[Number(roleId)] || AdminDashboard

  return <RoleDashboard />
}
