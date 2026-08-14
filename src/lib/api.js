import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * 401 dari server berarti token sudah tidak valid - kadaluwarsa krn idle
 * >2 jam (lihat backend ExpireIdleToken), dihapus manual, atau memang
 * belum/tidak pernah login. 403 (kredensial salah, role tidak berwenang,
 * dst) SENGAJA tidak disentuh di sini - itu bukan soal token, jangan
 * dianggap "sesi habis". Dicek localStorage dulu supaya tidak nge-reload
 * halaman /login itu sendiri kalau kebetulan ada 401 yang tidak terkait
 * sesi (mis. race condition).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('roleId')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
