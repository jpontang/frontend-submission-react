import { createContext, useContext, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [roleId, setRoleId] = useState(() => {
    const stored = localStorage.getItem('roleId')
    return stored ? Number(stored) : null
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function login(email, password) {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('roleId', data.role_id)
      setUser(data.user)
      setRoleId(Number(data.role_id))
      return true
    } catch (err) {
      setError(err.response?.data?.msg || 'Login gagal, periksa kembali email dan password.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch {
      // token mungkin sudah invalid, tetap lanjut hapus sesi lokal
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('roleId')
    setUser(null)
    setRoleId(null)
  }

  return (
    <AuthContext.Provider value={{ user, roleId, login, logout, error, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
