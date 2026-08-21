import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, BellRing, Check, Volume2, VolumeX } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

function formatRelativeTime(value) {
  const date = new Date(value)
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (diffSec < 60) return 'Baru saja'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Lonceng notifikasi di Topbar - dropdown daftar notifikasi + badge jumlah
 * belum dibaca (dari NotificationContext, di-poll tiap 20 detik). Juga
 * tempat user mengaktifkan izin Notification API browser & suara beep,
 * disimpan longgar di sini (bukan halaman settings terpisah) supaya
 * ditemukan tepat saat relevan.
 */
export default function NotificationBell() {
  const notif = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!notif) return null

  const {
    items,
    unreadCount,
    loading,
    permission,
    soundEnabled,
    requestPermission,
    toggleSound,
    markRead,
    markAllRead,
  } = notif

  function handleToggle() {
    setOpen((v) => !v)
  }

  // Klik notifikasi langsung membuka modal review pengajuan/peminjaman
  // terkait di halamannya (lewat query param `open`, dibaca oleh
  // Pengajuan.jsx/Peminjaman.jsx) - jadi tidak perlu pindah halaman manual
  // lalu cari sendiri barisnya di tabel. navigate() ke rute yang sama pun
  // tetap memicu perubahan query param (SPA, tanpa reload penuh), jadi
  // berfungsi juga kalau user kebetulan sudah ada di halaman itu.
  function handleItemClick(item) {
    if (!item.is_read) markRead(item.id)
    setOpen(false)

    if (item.pengajuan?.id) {
      navigate(`/yayasan/pengajuan?open=${item.pengajuan.id}`)
    } else if (item.peminjaman?.id) {
      navigate(`/yayasan/peminjaman?open=${item.peminjaman.id}`)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifikasi</span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Tandai semua sudah dibaca"
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <Check size={13} />
                  Semua dibaca
                </button>
              )}
            </div>
          </div>

          {permission === 'default' && (
            <div className="flex items-start gap-2 border-b border-slate-100 bg-amber-50 px-4 py-2.5">
              <BellRing size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <div className="flex-1 text-xs text-amber-800">
                Aktifkan notifikasi browser supaya tetap diberitahu walau tab ini tidak aktif.
                <button
                  onClick={requestPermission}
                  className="mt-1 block font-semibold text-amber-900 underline underline-offset-2"
                >
                  Aktifkan sekarang
                </button>
              </div>
            </div>
          )}
          {permission === 'denied' && (
            <div className="flex items-start gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
              <BellOff size={16} className="mt-0.5 shrink-0" />
              Notifikasi browser diblokir. Aktifkan lewat pengaturan situs di browser Anda kalau ingin
              pengingat muncul walau tab ini tidak aktif.
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Memuat notifikasi...</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Belum ada notifikasi.</p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 ${
                  item.is_read ? '' : 'bg-indigo-50/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  {!item.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />}
                  <span className={`text-sm ${item.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                    {item.judul}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{item.pesan}</p>
                <span className="text-[11px] text-slate-400">{formatRelativeTime(item.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
