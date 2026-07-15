import { Routes, Route } from 'react-router-dom'
import UserLayout from './layouts/UserLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import { ROLES } from './config/navigation'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pengajuan from './pages/Pengajuan'
import Users from './pages/Users'
import Settings from './pages/Settings'
import BudgetControl from './pages/BudgetControl'
import Penerimaan from './pages/Penerimaan'
import QCReview from './pages/QCReview'
import Suplayer from './pages/Suplayer'

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
        <Route path="pengajuan" element={<Pengajuan />} />
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
          path="suplayer"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.SUPLAYER]}>
              <Suplayer />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  )
}
