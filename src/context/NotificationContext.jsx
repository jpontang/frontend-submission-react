import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const POLL_INTERVAL_MS = 20000

/**
 * Beep pendek pakai Web Audio API (oscillator), BUKAN file audio - tidak
 * perlu asset eksternal & tidak kena masalah autoplay policy utk <audio>.
 * Gagal diam-diam kalau browser tidak dukung/API-nya diblokir - badge &
 * notifikasi browser tetap jalan tanpa suara.
 */
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.35)
    oscillator.onended = () => ctx.close()
  } catch {
    // Web Audio tidak didukung/diblokir browser - abaikan.
  }
}

/**
 * Notifikasi lonceng bell: poll GET /yayasan/notifikasi tiap 20 detik,
 * dipakai lintas halaman lewat Topbar. Notifikasi baru (id > id terakhir
 * yg pernah dilihat, is_read=false) memicu Notification API browser (kalau
 * izinnya sudah granted) + bunyi beep. Deteksi "baru" pakai id, bukan
 * selisih unreadCount, supaya tidak salah trigger kalau notif ditandai
 * dibaca dari tab/device lain di antara dua polling (unreadCount bisa naik
 * TURUN, id besar yg baru tetap valid dideteksi sbg baru).
 */
export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('notif_sound') !== 'off')
  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const lastSeenIdRef = useRef(null)
  const initializedRef = useRef(false)
  // load() dibungkus useCallback dgn deps kosong (dipanggil dari setInterval,
  // tidak boleh sering diciptakan ulang) - soundEnabled dibaca lewat ref ini
  // supaya tidak stale closure tanpa harus menjadikannya dependency.
  const soundEnabledRef = useRef(soundEnabled)

  const unreadCount = items.filter((n) => !n.is_read).length

  function notifyBrowser(baru) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    baru.slice(0, 3).forEach((n) => {
      try {
        // eslint-disable-next-line no-new
        new Notification(n.judul, { body: n.pesan, tag: `pengajuan-notif-${n.id}` })
      } catch {
        // beberapa lingkungan (mis. iframe) menolak Notification() - abaikan.
      }
    })
  }

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/yayasan/notifikasi')
      .then(({ data }) => {
        setError(null)
        if (initializedRef.current && lastSeenIdRef.current !== null) {
          const baru = data.filter((n) => n.id > lastSeenIdRef.current && !n.is_read)
          if (baru.length > 0) {
            notifyBrowser(baru)
            if (soundEnabledRef.current) playBeep()
          }
        }
        if (data.length > 0) {
          lastSeenIdRef.current = Math.max(data[0].id, lastSeenIdRef.current ?? 0)
        }
        initializedRef.current = true
        setItems(data)
      })
      .catch((err) => setError(err.response?.data?.msg || 'Gagal memuat notifikasi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    if (!user) {
      setItems([])
      initializedRef.current = false
      lastSeenIdRef.current = null
      return
    }
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [user, load])

  function requestPermission() {
    if (typeof Notification === 'undefined') return Promise.resolve('unsupported')
    return Notification.requestPermission().then((result) => {
      setPermission(result)
      return result
    })
  }

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem('notif_sound', next ? 'on' : 'off')
      return next
    })
  }

  function markRead(id) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    api.post(`/yayasan/notifikasi/${id}/read`).catch(() => load())
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    api.post('/yayasan/notifikasi/read-all').catch(() => load())
  }

  const value = {
    items,
    unreadCount,
    loading,
    error,
    permission,
    soundEnabled,
    requestPermission,
    toggleSound,
    markRead,
    markAllRead,
    refresh: load,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationContext)
}
