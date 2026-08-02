import { useEffect, useState } from 'react'
import Modal from './Modal'
import PengajuanStatusBadge from './PengajuanStatusBadge'
import { ROLES } from '../config/navigation'
import api from '../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatTanggal(value) {
  return value ? new Date(value).toLocaleString('id-ID') : '-'
}

function formatTanggalSaja(value) {
  return value ? new Date(value).toLocaleDateString('id-ID') : '-'
}

const PENGEMBALIAN_STYLES = {
  belum_lunas: 'bg-amber-50 text-amber-700',
  sebagian: 'bg-blue-50 text-blue-700',
  lunas: 'bg-emerald-50 text-emerald-700',
}

const PENGEMBALIAN_LABELS = {
  belum_lunas: 'Belum Lunas',
  sebagian: 'Sebagian',
  lunas: 'Lunas',
}

/**
 * Detail satu peminjaman + tombol aksi sesuai tahap & role (sama pola dgn
 * PengajuanDetailModal - divisi/QC/Bendahara approve, tombol ditampilkan
 * client-side, wewenang sebenarnya tetap divalidasi backend). Setelah
 * disetujui_bendahara, tampil juga riwayat & form "Catat Pengembalian".
 */
export default function PeminjamanDetailModal({ open, onClose, peminjaman, roleId, onActionDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showReject, setShowReject] = useState(false)
  const [showRevisi, setShowRevisi] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [showPengembalian, setShowPengembalian] = useState(false)
  const [pengembalianForm, setPengembalianForm] = useState({
    nominal: '',
    tanggal_bayar: new Date().toISOString().slice(0, 10),
    keterangan: '',
  })

  useEffect(() => {
    setError(null)
    setShowReject(false)
    setShowRevisi(false)
    setShowPengembalian(false)
    setCatatan('')
  }, [peminjaman])

  if (!peminjaman) return null

  const isAdmin = Number(roleId) === ROLES.ADMIN
  const canDivisi = isAdmin || Number(roleId) === ROLES.DIVISI_YAYASAN
  const canQc = isAdmin || Number(roleId) === ROLES.QC
  const canBendahara = isAdmin || Number(roleId) === ROLES.BENDAHARA

  async function runAction(path, payload) {
    setBusy(true)
    setError(null)
    try {
      await api.post(`/yayasan/peminjaman/${peminjaman.id}/${path}`, payload)
      onActionDone?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Aksi gagal.')
    } finally {
      setBusy(false)
    }
  }

  async function submitPengembalian(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post(`/yayasan/peminjaman/${peminjaman.id}/pengembalian`, {
        nominal: Number(pengembalianForm.nominal) || 0,
        tanggal_bayar: pengembalianForm.tanggal_bayar,
        keterangan: pengembalianForm.keterangan || null,
      })
      onActionDone?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mencatat pengembalian.')
    } finally {
      setBusy(false)
    }
  }

  const sisaPinjaman = (peminjaman.nominal || 0) - (peminjaman.total_dikembalikan || 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Peminjaman ${peminjaman.kode_peminjaman}`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Tutup
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PengajuanStatusBadge status={peminjaman.status} />
          <span className="text-sm font-semibold text-slate-900">{formatRupiah(peminjaman.nominal)}</span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Divisi Peminjam</dt>
          <dd className="text-slate-800">{peminjaman.divisi?.nama_divisi || '-'}</dd>
          <dt className="text-slate-500">Divisi Pemberi</dt>
          <dd className="text-slate-800">{peminjaman.divisi_pemberi?.nama_divisi || '-'}</dd>
          <dt className="text-slate-500">Pengaju</dt>
          <dd className="text-slate-800">{peminjaman.nama_pengaju || '-'}</dd>
          <dt className="text-slate-500">Keperluan</dt>
          <dd className="text-slate-800">{peminjaman.keperluan || '-'}</dd>
          <dt className="text-slate-500">Tanggal Pinjam</dt>
          <dd className="text-slate-800">{formatTanggalSaja(peminjaman.tanggal_pinjam)}</dd>
          <dt className="text-slate-500">Jatuh Tempo</dt>
          <dd className="text-slate-800">{formatTanggalSaja(peminjaman.jatuh_tempo)}</dd>
        </dl>

        <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p>Divisi: {peminjaman.disetujui_divisi_oleh ? `disetujui ${formatTanggal(peminjaman.tanggal_disetujui_divisi)}` : 'belum'}</p>
          <p>
            QC: {peminjaman.disetujui_qc_oleh ? `ACC ${formatTanggal(peminjaman.tanggal_disetujui_qc)}` : 'belum'}
            {peminjaman.catatan_qc && ` — "${peminjaman.catatan_qc}"`}
            {peminjaman.jumlah_revisi > 0 && ` (direvisi ${peminjaman.jumlah_revisi}x)`}
          </p>
          <p>
            Bendahara:{' '}
            {peminjaman.disetujui_bendahara_oleh ? `ACC ${formatTanggal(peminjaman.tanggal_disetujui_bendahara)}` : 'belum'}
          </p>
          {peminjaman.status === 'ditolak' && (
            <p className="text-rose-600">
              Ditolak pada tahap {peminjaman.ditolak_pada_tahap} — {formatTanggal(peminjaman.tanggal_ditolak)}
              {peminjaman.catatan_penolakan && `: "${peminjaman.catatan_penolakan}"`}
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        {/* Tahap 1: Divisi/parent divisi peminjam */}
        {peminjaman.status === 'diajukan' && canDivisi && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('approve-divisi')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              Setujui (Divisi)
            </button>
            <button
              type="button"
              onClick={() => setShowReject((v) => !v)}
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Tolak
            </button>
          </div>
        )}

        {/* Tahap 2: QC */}
        {peminjaman.status === 'disetujui_divisi' && canQc && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('approve-qc')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              ACC (QC)
            </button>
            <button
              type="button"
              onClick={() => setShowRevisi((v) => !v)}
              className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              Minta Revisi
            </button>
            <button
              type="button"
              onClick={() => setShowReject((v) => !v)}
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Tolak
            </button>
          </div>
        )}

        {/* Tahap 3: Bendahara */}
        {peminjaman.status === 'disetujui_qc' && canBendahara && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('approve-bendahara')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              ACC (Bendahara)
            </button>
            <button
              type="button"
              onClick={() => setShowReject((v) => !v)}
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Tolak
            </button>
          </div>
        )}

        {/* Revisi QC: pengaju submit ulang (peminjaman tidak punya rincian
        item yg bisa diedit spt pengajuan, jadi cukup tombol submit ulang) */}
        {peminjaman.status === 'revisi_qc' && canDivisi && (
          <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm text-orange-800">
              QC minta perbaikan: "{peminjaman.catatan_qc}". Submit ulang kalau sudah dikoordinasikan.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('resubmit')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              Submit Ulang
            </button>
          </div>
        )}

        {/* Selesai: status pengembalian + riwayat + form catat pengembalian */}
        {peminjaman.status === 'disetujui_bendahara' && (
          <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Status Pengembalian</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  PENGEMBALIAN_STYLES[peminjaman.status_pengembalian] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {PENGEMBALIAN_LABELS[peminjaman.status_pengembalian] || peminjaman.status_pengembalian}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Sudah dikembalikan {formatRupiah(peminjaman.total_dikembalikan)} dari {formatRupiah(peminjaman.nominal)}
              {peminjaman.status_pengembalian !== 'lunas' && ` (sisa ${formatRupiah(sisaPinjaman)})`}
            </p>

            {(peminjaman.pengembalian || []).length > 0 && (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                {peminjaman.pengembalian.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-slate-600">{formatTanggalSaja(p.tanggal_bayar)}</span>
                    <span className="font-medium text-slate-800">{formatRupiah(p.nominal)}</span>
                  </div>
                ))}
              </div>
            )}

            {peminjaman.status_pengembalian !== 'lunas' && (canBendahara || canDivisi) && (
              <>
                {!showPengembalian ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPengembalianForm({ ...pengembalianForm, nominal: String(sisaPinjaman) })
                      setShowPengembalian(true)
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    Catat Pengembalian
                  </button>
                ) : (
                  <form onSubmit={submitPengembalian} className="space-y-2 rounded-lg bg-slate-50 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Nominal</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max={sisaPinjaman}
                          value={pengembalianForm.nominal}
                          onChange={(e) => setPengembalianForm({ ...pengembalianForm, nominal: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Tanggal Bayar</label>
                        <input
                          type="date"
                          required
                          value={pengembalianForm.tanggal_bayar}
                          onChange={(e) => setPengembalianForm({ ...pengembalianForm, tanggal_bayar: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Keterangan (opsional)"
                      value={pengembalianForm.keterangan}
                      onChange={(e) => setPengembalianForm({ ...pengembalianForm, keterangan: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {busy ? 'Menyimpan...' : 'Simpan Pengembalian'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {showReject && (
          <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <textarea
              rows={2}
              placeholder="Catatan penolakan (opsional)"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-lg border border-rose-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('reject', { catatan: catatan || null })}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
            >
              Konfirmasi Tolak
            </button>
          </div>
        )}

        {showRevisi && (
          <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <textarea
              rows={2}
              required
              placeholder="Catatan revisi (wajib diisi)"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-lg border border-orange-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <button
              type="button"
              disabled={busy || !catatan.trim()}
              onClick={() => runAction('revise-qc', { catatan })}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-60"
            >
              Kirim Permintaan Revisi
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
