import { Routes, Route } from 'react-router-dom'
import UserLayout from './layouts/UserLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import { ROLES } from './config/navigation'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Settings from './pages/Settings'
import BudgetControl from './pages/BudgetControl'
import Penerimaan from './pages/Penerimaan'
import QCReview from './pages/QCReview'
import BendaharaReview from './pages/BendaharaReview'
import Suplayer from './pages/Suplayer'
import Lembaga from './pages/yayasan/Lembaga'
import Jabatan from './pages/yayasan/Jabatan'
import Divisi from './pages/yayasan/Divisi'
import Pengurus from './pages/yayasan/Pengurus'
import Aset from './pages/yayasan/Aset'
import Dokumen from './pages/yayasan/Dokumen'
import KasTransaksi from './pages/yayasan/KasTransaksi'
import PengajuanYayasan from './pages/yayasan/Pengajuan'
import Peminjaman from './pages/yayasan/Peminjaman'
import PotonganPendapatan from './pages/yayasan/PotonganPendapatan'
import CronLog from './pages/yayasan/CronLog'
import KasTransaksiYayasan from './pages/yayasan/KasTransaksiYayasan'
import RekapKasBulanan from './pages/yayasan/RekapKasBulanan'
import WhatsappSetting from './pages/WhatsappSetting'
import WhatsappLog from './pages/WhatsappLog'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />

        <Route
          path="users"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Users />
            </RoleRoute>
          }
        />
        <Route
          path="roles"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Roles />
            </RoleRoute>
          }
        />
        <Route
          path="budget-control"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA]}>
              <BudgetControl />
            </RoleRoute>
          }
        />
        <Route
          path="penerimaan"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA]}>
              <Penerimaan />
            </RoleRoute>
          }
        />
        <Route
          path="qc-review"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.QC]}>
              <QCReview />
            </RoleRoute>
          }
        />
        <Route
          path="bendahara-review"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA]}>
              <BendaharaReview />
            </RoleRoute>
          }
        />
        <Route
          path="suplayer"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.SUPLAYER]}>
              <Suplayer />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/lembaga"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Lembaga />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/jabatan"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Jabatan />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/divisi"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Divisi />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/pengurus"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Pengurus />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/aset"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Aset />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/dokumen"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <Dokumen />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/kas-transaksi"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA, ROLES.DIVISI_YAYASAN]}>
              <KasTransaksi />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/pengajuan"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA, ROLES.QC, ROLES.DIVISI_YAYASAN]}>
              <PengajuanYayasan />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/peminjaman"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA, ROLES.QC, ROLES.DIVISI_YAYASAN]}>
              <Peminjaman />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/potongan-pendapatan"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA]}>
              <PotonganPendapatan />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/cron-log"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <CronLog />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/kas-transaksi-yayasan"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <KasTransaksiYayasan />
            </RoleRoute>
          }
        />
        <Route
          path="yayasan/rekap-kas-bulanan"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <RekapKasBulanan />
            </RoleRoute>
          }
        />
        <Route
          path="whatsapp-setting"
          element={
            <RoleRoute allow={[ROLES.ADMIN]}>
              <WhatsappSetting />
            </RoleRoute>
          }
        />
        <Route
          path="whatsapp-log"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.BENDAHARA]}>
              <WhatsappLog />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  )
}
