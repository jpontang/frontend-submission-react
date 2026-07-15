import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Membatasi akses route berdasarkan role_id, dipakai di dalam ProtectedRoute.
 * Akses langsung lewat URL oleh role yang tidak diizinkan akan dialihkan ke "/".
 */
export default function RoleRoute({ allow, children }) {
  const { roleId } = useAuth()

  if (!allow.includes(Number(roleId))) {
    return <Navigate to="/" replace />
  }

  return children
}
