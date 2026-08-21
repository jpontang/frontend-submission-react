const STATUS_CONFIG = {
  diajukan: { label: 'Diajukan', className: 'bg-amber-50 text-amber-700' },
  revisi_divisi: { label: 'Revisi (Divisi)', className: 'bg-orange-50 text-orange-700' },
  disetujui_divisi: { label: 'Disetujui Divisi', className: 'bg-blue-50 text-blue-700' },
  revisi_qc: { label: 'Revisi (QC)', className: 'bg-orange-50 text-orange-700' },
  disetujui_qc: { label: 'Disetujui QC', className: 'bg-cyan-50 text-cyan-700' },
  disetujui_bendahara: { label: 'Menunggu Konfirmasi Terima', className: 'bg-violet-50 text-violet-700' },
  diterima_sebagian: { label: 'Diterima Sebagian', className: 'bg-amber-50 text-amber-700' },
  selesai: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700' },
  bermasalah: { label: 'Bermasalah', className: 'bg-rose-50 text-rose-700' },
  ditolak: { label: 'Ditolak', className: 'bg-rose-50 text-rose-700' },
}

// disetujui_bendahara sebenarnya punya 2 sub-tahap yang mudah tertukar:
// PO/dana belum "dikirimkan ke pengaju" (masih giliran Bendahara) vs sudah
// (giliran pengaju konfirmasi terima) - lihat gate canValidasiPenerimaan di
// PengajuanDetailModal. Label "Menunggu Konfirmasi Terima" menyesatkan kalau
// dipakai utk sub-tahap pertama (kelihatan siap dikonfirmasi padahal belum).
// jenisPengajuan dkk OPSIONAL - kalau tidak diisi (dipakai jg oleh
// Peminjaman yang tidak punya field2 ini), badge fallback ke label default.
const STATUS_BENDAHARA_BELUM_DIKIRIM = {
  barang: { label: 'Menunggu PO Dikirim', className: 'bg-blue-50 text-blue-700' },
  dana: { label: 'Menunggu Pencairan Dana', className: 'bg-blue-50 text-blue-700' },
}

/**
 * Warna per tahap alur pengajuan: diajukan (kuning) -> revisi_divisi
 * (oranye, perlu perbaikan) / disetujui_divisi (biru) -> revisi_qc (oranye,
 * perlu perbaikan) / disetujui_qc (cyan) -> disetujui_bendahara: PO belum
 * dikirim/dana belum dicairkan (biru, masih giliran Bendahara) atau sudah
 * (ungu, giliran pengaju konfirmasi terima) -> diterima_sebagian (kuning,
 * belum tuntas) / selesai (hijau, final) / bermasalah (merah, perlu
 * follow-up) / ditolak (merah, final).
 */
export default function PengajuanStatusBadge({ status, jenisPengajuan, pdfTerkirim, sudahDicairkan }) {
  let config = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-600' }

  if (status === 'disetujui_bendahara' && jenisPengajuan) {
    const sudahDikirimkanKePengaju = jenisPengajuan === 'barang' ? pdfTerkirim : sudahDicairkan
    if (!sudahDikirimkanKePengaju) {
      config = STATUS_BENDAHARA_BELUM_DIKIRIM[jenisPengajuan] || config
    }
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
