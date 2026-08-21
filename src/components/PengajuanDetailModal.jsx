import { useEffect, useState } from 'react'
import Modal from './Modal'
import PengajuanStatusBadge, { STATUS_CONFIG } from './PengajuanStatusBadge'
import DetilPengajuanEditor from './DetilPengajuanEditor'
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

/**
 * Detail satu pengajuan + tombol aksi sesuai tahap & role user yang login.
 * Tombol ditampilkan berdasarkan status pengajuan + roleId (client-side,
 * cuma utk UX) - wewenang sebenarnya tetap divalidasi backend (mis. cuma
 * kepala divisi/parent yang benar yang bisa approve-divisi), jadi kalau
 * user menekan tombol yang ternyata tidak berwenang, pesan error dari
 * backend yang ditampilkan.
 */
export default function PengajuanDetailModal({ open, onClose, pengajuan, roleId, onActionDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showReject, setShowReject] = useState(false)
  const [showRevisi, setShowRevisi] = useState(false)
  const [showDiterimaSebagian, setShowDiterimaSebagian] = useState(false)
  const [showLaporMasalah, setShowLaporMasalah] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [fotoPenerimaanFile, setFotoPenerimaanFile] = useState(null)
  const [invoicePenerimaanFile, setInvoicePenerimaanFile] = useState(null)
  const [resubmitItems, setResubmitItems] = useState([])

  useEffect(() => {
    setError(null)
    setShowReject(false)
    setShowRevisi(false)
    setShowDiterimaSebagian(false)
    setShowLaporMasalah(false)
    setCatatan('')
    setFotoPenerimaanFile(null)
    setInvoicePenerimaanFile(null)
    if (pengajuan?.detil) {
      setResubmitItems(
        pengajuan.detil.map((d) => ({
          uraian: d.uraian,
          qty: d.qty,
          satuan: d.satuan || '',
          keterangan: d.keterangan || '',
          harga: d.harga,
          ppn: d.ppn,
        }))
      )
    }
  }, [pengajuan])

  if (!pengajuan) return null

  const isAdmin = Number(roleId) === ROLES.ADMIN
  const canDivisi = isAdmin || Number(roleId) === ROLES.DIVISI_YAYASAN
  const canQc = isAdmin || Number(roleId) === ROLES.QC
  const canBendahara = isAdmin || Number(roleId) === ROLES.BENDAHARA

  // Validasi penerimaan (confirm-diterima/diterima-sebagian/laporkan-masalah)
  // cuma utk yang berwenang: pengaju aslinya, kepala divisinya, atau kepala
  // PARENT divisinya - role DIVISI YAYASAN saja TIDAK cukup, krn satu
  // divisi/scope bisa berisi banyak pengaju & staff biasa (siapa pun di
  // scope bisa MELIHAT pengajuan siapa pun, lihat DivisiScopeMiddleware).
  // `can_konfirmasi_penerimaan` dihitung backend
  // (PengajuanController::appendCanKonfirmasiPenerimaan, sinkron persis
  // dgn isAuthorizedKonfirmasiPenerimaan yang jadi wewenang SEBENARNYA) -
  // JANGAN diganti balik ke cek role doang, itu penyebab tombolnya nongol
  // ke orang yang bakal ditolak backend. Sudah boleh begitu
  // disetujui_bendahara & barang-nya PO terkirim / dana-nya dicairkan,
  // atau sudah pernah ditandai 'diterima_sebagian' sebelumnya.
  const sudahDikirimkanKePengaju =
    pengajuan.jenis_pengajuan === 'barang' ? pengajuan.pdf_terkirim_ke_suplayer : pengajuan.sudah_dicairkan
  const canValidasiPenerimaan =
    pengajuan.can_konfirmasi_penerimaan &&
    (pengajuan.status === 'diterima_sebagian' ||
      (pengajuan.status === 'disetujui_bendahara' && sudahDikirimkanKePengaju))
  // Sudah disetujui Bendahara & orangnya berwenang konfirmasi nanti, TAPI
  // PO/dana belum benar2 dikirim/dicairkan - tombolnya belum boleh muncul
  // (lihat canValidasiPenerimaan), jadi tampilkan alasannya di sini supaya
  // tidak terlihat seperti menu-nya rusak/hilang begitu saja.
  const menungguPengirimanKePengaju =
    pengajuan.can_konfirmasi_penerimaan && pengajuan.status === 'disetujui_bendahara' && !sudahDikirimkanKePengaju

  // `files` opsional ({ foto_penerimaan, invoice_penerimaan }) - dipakai
  // aksi validasi penerimaan (confirm-diterima/diterima-sebagian/laporkan-
  // masalah) yang boleh menyertakan foto barang & invoice/kwitansi
  // sekaligus, independen satu sama lain. Kalau salah satu/keduanya ada,
  // payload dikirim sbg multipart/form-data (bukan JSON) supaya filenya
  // ikut terkirim.
  async function runAction(path, payload, files) {
    setBusy(true)
    setError(null)
    try {
      const hasFile = files && (files.foto_penerimaan || files.invoice_penerimaan)
      if (hasFile) {
        const formData = new FormData()
        Object.entries(payload || {}).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formData.append(key, value)
        })
        if (files.foto_penerimaan) formData.append('foto_penerimaan', files.foto_penerimaan)
        if (files.invoice_penerimaan) formData.append('invoice_penerimaan', files.invoice_penerimaan)
        await api.post(`/yayasan/pengajuan/${pengajuan.id}/${path}`, formData)
      } else {
        await api.post(`/yayasan/pengajuan/${pengajuan.id}/${path}`, payload)
      }
      onActionDone?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.msg || 'Aksi gagal.')
    } finally {
      setBusy(false)
    }
  }

  async function downloadFileProposal() {
    setBusy(true)
    setError(null)
    try {
      const res = await api.get(`/yayasan/pengajuan/${pengajuan.id}/file-proposal`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = pengajuan.nama_file
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengunduh file proposal.')
    } finally {
      setBusy(false)
    }
  }

  // Dipakai bareng utk unduh foto barang maupun invoice/kwitansi
  // penerimaan - dua lampiran terpisah dgn endpoint & nama file masing2.
  async function downloadLampiranPenerimaan(endpoint, namaFile, gagalMsg) {
    setBusy(true)
    setError(null)
    try {
      const res = await api.get(`/yayasan/pengajuan/${pengajuan.id}/${endpoint}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = namaFile
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.msg || gagalMsg)
    } finally {
      setBusy(false)
    }
  }

  async function downloadPdf() {
    setBusy(true)
    setError(null)
    try {
      const res = await api.get(`/yayasan/pengajuan/${pengajuan.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `PO-${pengajuan.kode_pengajuan}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengunduh PDF.')
    } finally {
      setBusy(false)
    }
  }

  async function sendPoEmail() {
    setBusy(true)
    setError(null)
    try {
      await api.post(`/yayasan/pengajuan/${pengajuan.id}/kirim-email-suplayer`)
      onActionDone?.()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengirim email ke supplier.')
    } finally {
      setBusy(false)
    }
  }

  // Alternatif kirim email - tersedia kapan pun (bukan cuma fallback saat
  // email gagal), krn beberapa supplier lebih responsif di WhatsApp.
  async function sendPoWhatsapp() {
    setBusy(true)
    setError(null)
    try {
      await api.post(`/yayasan/pengajuan/${pengajuan.id}/kirim-whatsapp-suplayer`)
      onActionDone?.()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal mengirim WhatsApp ke supplier.')
    } finally {
      setBusy(false)
    }
  }

  // Tandai PO terkirim TANPA benar2 kirim apa pun lewat sistem - dipakai
  // kalau Bendahara sudah kirim PO lewat jalur lain di luar sistem (WA
  // pribadi, telepon, ketemu langsung, dst) dan cuma perlu update
  // statusnya di sini. Dikonfirmasi dulu (window.confirm) krn aksinya
  // "percaya begitu saja" - tidak ada bukti pengiriman yg tercatat sistem.
  async function tandaiPoTerkirimManual() {
    if (!window.confirm('Tandai PO ini sudah dikirim ke supplier? Gunakan ini HANYA kalau PO memang sudah dikirim lewat cara lain di luar sistem.')) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.post(`/yayasan/pengajuan/${pengajuan.id}/tandai-po-terkirim`)
      onActionDone?.()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menandai PO terkirim.')
    } finally {
      setBusy(false)
    }
  }

  async function markDicairkan() {
    setBusy(true)
    setError(null)
    try {
      await api.post(`/yayasan/pengajuan/${pengajuan.id}/tandai-dicairkan`)
      onActionDone?.()
    } catch (err) {
      setError(err.response?.data?.msg || 'Gagal menandai dicairkan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pengajuan ${pengajuan.kode_pengajuan}`}
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
          <PengajuanStatusBadge
            status={pengajuan.status}
            jenisPengajuan={pengajuan.jenis_pengajuan}
            pdfTerkirim={pengajuan.pdf_terkirim_ke_suplayer}
            sudahDicairkan={pengajuan.sudah_dicairkan}
          />
          <span className="text-sm font-semibold text-slate-900">
            {formatRupiah(pengajuan.total_nilai_pengajuan)}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Divisi</dt>
          <dd className="text-slate-800">{pengajuan.divisi?.nama_divisi || '-'}</dd>
          <dt className="text-slate-500">Jenis</dt>
          <dd className="text-slate-800">
            {pengajuan.jenis_pengajuan === 'barang' ? 'Pengadaan Barang' : 'Pengajuan Dana'}
          </dd>
          <dt className="text-slate-500">Pengaju</dt>
          <dd className="text-slate-800">{pengajuan.nama_pengaju || '-'}</dd>
          <dt className="text-slate-500">Kegiatan</dt>
          <dd className="text-slate-800">{pengajuan.nama_kegiatan || '-'}</dd>
          {pengajuan.deskripsi && (
            <>
              <dt className="text-slate-500">Deskripsi</dt>
              <dd className="text-slate-800">{pengajuan.deskripsi}</dd>
            </>
          )}
          {pengajuan.nama_sumber_dana && (
            <>
              <dt className="text-slate-500">Sumber Dana</dt>
              <dd className="text-slate-800">{pengajuan.nama_sumber_dana}</dd>
            </>
          )}
          {pengajuan.jenis_pengajuan === 'barang' && (
            <>
              <dt className="text-slate-500">Supplier</dt>
              <dd className="text-slate-800">{pengajuan.suplayer?.nama_suplayer || '-'}</dd>
            </>
          )}
          {pengajuan.jenis_pengajuan === 'dana' && (pengajuan.nama_bank || pengajuan.no_rekening) && (
            <>
              <dt className="text-slate-500">Rekening Tujuan</dt>
              <dd className="text-slate-800">
                {pengajuan.nama_bank} {pengajuan.no_rekening} a.n. {pengajuan.nama_pemilik_rekening}
              </dd>
            </>
          )}
        </dl>

        {pengajuan.nama_file && (
          <button
            type="button"
            disabled={busy}
            onClick={downloadFileProposal}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            📎 Unduh File Proposal
          </button>
        )}

        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Rincian Item</p>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {(pengajuan.detil || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-slate-700">
                  {item.uraian} ({item.qty} {item.satuan || ''})
                  {item.keterangan && (
                    <span className="mt-0.5 block text-xs text-slate-400">{item.keterangan}</span>
                  )}
                </span>
                <span className="whitespace-nowrap font-medium text-slate-800">{formatRupiah(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p>
            Divisi: {pengajuan.disetujui_divisi_oleh ? `disetujui ${formatTanggal(pengajuan.tanggal_disetujui_divisi)}` : 'belum'}
            {pengajuan.status === 'revisi_divisi' && pengajuan.catatan_divisi && ` — diminta revisi: "${pengajuan.catatan_divisi}"`}
          </p>
          <p>
            QC: {pengajuan.disetujui_qc_oleh ? `ACC ${formatTanggal(pengajuan.tanggal_disetujui_qc)}` : 'belum'}
            {pengajuan.catatan_qc && ` — "${pengajuan.catatan_qc}"`}
            {pengajuan.jumlah_revisi > 0 && ` (direvisi ${pengajuan.jumlah_revisi}x)`}
          </p>
          <p>
            Bendahara:{' '}
            {pengajuan.disetujui_bendahara_oleh ? `ACC ${formatTanggal(pengajuan.tanggal_disetujui_bendahara)}` : 'belum'}
          </p>
          {pengajuan.konfirmasi_oleh && (
            <p>
              Penerimaan: {STATUS_CONFIG[pengajuan.status]?.label || pengajuan.status} pada{' '}
              {formatTanggal(pengajuan.tanggal_konfirmasi)}
              {pengajuan.catatan_konfirmasi && ` — "${pengajuan.catatan_konfirmasi}"`}
            </p>
          )}
          {pengajuan.status === 'ditolak' && (
            <p className="text-rose-600">
              Ditolak pada tahap {pengajuan.ditolak_pada_tahap} — {formatTanggal(pengajuan.tanggal_ditolak)}
              {pengajuan.catatan_penolakan && `: "${pengajuan.catatan_penolakan}"`}
            </p>
          )}
        </div>

        {(pengajuan.foto_penerimaan || pengajuan.invoice_penerimaan) && (
          <div className="flex flex-wrap gap-2">
            {pengajuan.foto_penerimaan && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  downloadLampiranPenerimaan(
                    'foto-penerimaan',
                    pengajuan.foto_penerimaan,
                    'Gagal mengunduh foto barang.'
                  )
                }
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                📷 Unduh Foto Barang
              </button>
            )}
            {pengajuan.invoice_penerimaan && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  downloadLampiranPenerimaan(
                    'invoice-penerimaan',
                    pengajuan.invoice_penerimaan,
                    'Gagal mengunduh invoice.'
                  )
                }
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                🧾 Unduh Invoice
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        {/* Tahap 1: Divisi/parent divisi */}
        {pengajuan.status === 'diajukan' && canDivisi && (
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

        {/* Tahap 2: QC */}
        {pengajuan.status === 'disetujui_divisi' && canQc && (
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
        {pengajuan.status === 'disetujui_qc' && canBendahara && (
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

        {/* Revisi Divisi: pengaju perbaiki lalu submit ulang, balik ke antrian divisi */}
        {pengajuan.status === 'revisi_divisi' && canDivisi && (
          <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            {pengajuan.catatan_divisi && (
              <p className="text-sm text-orange-800">Catatan: "{pengajuan.catatan_divisi}"</p>
            )}
            <p className="text-sm text-orange-800">Perbaiki rincian item lalu submit ulang.</p>
            <DetilPengajuanEditor items={resubmitItems} onChange={setResubmitItems} />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('resubmit', {
                  detil: resubmitItems.map((item) => ({
                    uraian: item.uraian,
                    qty: Number(item.qty) || 1,
                    satuan: item.satuan || null,
                    keterangan: item.keterangan || null,
                    harga: Number(item.harga) || 0,
                    ppn: Number(item.ppn) || 0,
                  })),
                })
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              Submit Ulang
            </button>
          </div>
        )}

        {/* Revisi QC: pengaju perbaiki lalu submit ulang */}
        {pengajuan.status === 'revisi_qc' && canDivisi && (
          <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm text-orange-800">Perbaiki rincian item lalu submit ulang.</p>
            <DetilPengajuanEditor items={resubmitItems} onChange={setResubmitItems} />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('resubmit', {
                  detil: resubmitItems.map((item) => ({
                    uraian: item.uraian,
                    qty: Number(item.qty) || 1,
                    satuan: item.satuan || null,
                    keterangan: item.keterangan || null,
                    harga: Number(item.harga) || 0,
                    ppn: Number(item.ppn) || 0,
                  })),
                })
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              Submit Ulang
            </button>
          </div>
        )}

        {/* Selesai: pengadaan barang -> PO ke supplier; pengajuan dana -> tandai dicairkan */}
        {pengajuan.status === 'disetujui_bendahara' && canBendahara && pengajuan.jenis_pengajuan === 'barang' && (
          <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm text-emerald-800">
              {pengajuan.pdf_terkirim_ke_suplayer
                ? `PO sudah dikirim ke supplier pada ${formatTanggal(pengajuan.tanggal_pdf_terkirim)}.`
                : 'PO siap dikirim ke supplier.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={downloadPdf}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Download PDF PO
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={sendPoEmail}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                Kirim Email ke Supplier
              </button>
              {/* Selalu tampil sbg alternatif (bukan cuma fallback kalau email
                  gagal) - sama-sama menandai PO terkirim kalau berhasil. */}
              <button
                type="button"
                disabled={busy}
                onClick={sendPoWhatsapp}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                Kirim via WhatsApp
              </button>
              {/* PO sudah dikirim di luar sistem (WA pribadi/telepon/dst) -
                  tandai statusnya di sini tanpa benar2 mengirim apa pun. */}
              <button
                type="button"
                disabled={busy}
                onClick={tandaiPoTerkirimManual}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Tandai Sudah Terkirim (Manual)
              </button>
            </div>
          </div>
        )}

        {pengajuan.status === 'disetujui_bendahara' && canBendahara && pengajuan.jenis_pengajuan === 'dana' && (
          <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            {pengajuan.sudah_dicairkan ? (
              <p className="text-sm text-emerald-800">
                Sudah dicairkan pada {formatTanggal(pengajuan.tanggal_pencairan)}.
              </p>
            ) : (
              <>
                <p className="text-sm text-emerald-800">Dana siap ditransfer ke rekening pengaju.</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={markDicairkan}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  Tandai Sudah Dicairkan
                </button>
              </>
            )}
          </div>
        )}

        {menungguPengirimanKePengaju && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {pengajuan.jenis_pengajuan === 'barang'
              ? 'Sudah disetujui Bendahara, tapi PO belum dikirim ke supplier. Konfirmasi penerimaan baru bisa dilakukan setelah Bendahara mengirim PO.'
              : 'Sudah disetujui Bendahara, tapi dana belum ditandai dicairkan. Konfirmasi penerimaan baru bisa dilakukan setelah dana dicairkan.'}
          </div>
        )}

        {/* Validasi Penerimaan: PENGAJU konfirmasi barang/dana sudah sampai
            di tangannya - beda dari blok "Selesai" di atas yang aksinya
            Bendahara (kirim PO/tandai dicairkan). Muncul begitu PO
            terkirim/dana dicairkan, atau kalau sebelumnya sempat ditandai
            'diterima_sebagian' (masih bisa lanjut konfirmasi/lapor lagi). */}
        {canValidasiPenerimaan && (
          <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50 p-3">
            <p className="text-sm text-violet-800">
              {pengajuan.status === 'diterima_sebagian'
                ? `Sebelumnya ditandai baru diterima sebagian pada ${formatTanggal(pengajuan.tanggal_konfirmasi)}. Sudah lengkap atau ada masalah?`
                : 'Konfirmasi apakah barang/dana ini sudah Anda terima.'}
            </p>

            {/* Upload foto barang & invoice/kwitansi - opsional & independen
                satu sama lain, khusus pengadaan barang. File yang sama
                dipakai bersama oleh tombol mana pun yang diklik (Diterima
                Lengkap/Sebagian/Lapor Masalah). */}
            {pengajuan.jenis_pengajuan === 'barang' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-violet-800">
                    Foto Barang <span className="font-normal text-violet-500">- opsional</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFotoPenerimaanFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-violet-700 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-violet-700 hover:file:bg-violet-200"
                  />
                  <p className="mt-1 text-[11px] text-violet-500">Format PDF/JPG/PNG, maks 5MB.</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-violet-800">
                    Invoice / Kwitansi <span className="font-normal text-violet-500">- opsional</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setInvoicePenerimaanFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-violet-700 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-violet-700 hover:file:bg-violet-200"
                  />
                  <p className="mt-1 text-[11px] text-violet-500">Format PDF/DOC/DOCX/JPG/PNG, maks 5MB.</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(
                    'confirm-diterima',
                    { catatan: catatan || null },
                    { foto_penerimaan: fotoPenerimaanFile, invoice_penerimaan: invoicePenerimaanFile }
                  )
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                Diterima Lengkap
              </button>
              <button
                type="button"
                onClick={() => setShowDiterimaSebagian((v) => !v)}
                className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
              >
                Diterima Sebagian
              </button>
              <button
                type="button"
                onClick={() => setShowLaporMasalah((v) => !v)}
                className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Laporkan Masalah
              </button>
            </div>
          </div>
        )}

        {showDiterimaSebagian && (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <textarea
              rows={2}
              required
              placeholder="Keterangan bagian yang sudah diterima / yang masih kurang (wajib diisi)"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
            <button
              type="button"
              disabled={busy || !catatan.trim()}
              onClick={() =>
                runAction('diterima-sebagian', { catatan }, {
                  foto_penerimaan: fotoPenerimaanFile,
                  invoice_penerimaan: invoicePenerimaanFile,
                })
              }
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-60"
            >
              Simpan Status Diterima Sebagian
            </button>
          </div>
        )}

        {showLaporMasalah && (
          <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <textarea
              rows={2}
              required
              placeholder="Jelaskan masalahnya (wajib diisi) - mis. barang rusak/tidak sesuai, dana belum masuk, dll"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-lg border border-rose-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            />
            <button
              type="button"
              disabled={busy || !catatan.trim()}
              onClick={() =>
                runAction('laporkan-masalah', { catatan }, {
                  foto_penerimaan: fotoPenerimaanFile,
                  invoice_penerimaan: invoicePenerimaanFile,
                })
              }
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
            >
              Kirim Laporan Masalah
            </button>
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
              onClick={() => runAction(pengajuan.status === 'diajukan' ? 'revise-divisi' : 'revise-qc', { catatan })}
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
