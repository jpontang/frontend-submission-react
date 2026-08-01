const STATUS_CONFIG = {
  diajukan: { label: 'Diajukan', className: 'bg-amber-50 text-amber-700' },
  disetujui_divisi: { label: 'Disetujui Divisi', className: 'bg-blue-50 text-blue-700' },
  revisi_qc: { label: 'Revisi (QC)', className: 'bg-orange-50 text-orange-700' },
  disetujui_qc: { label: 'Disetujui QC', className: 'bg-cyan-50 text-cyan-700' },
  disetujui_bendahara: { label: 'Disetujui Bendahara', className: 'bg-emerald-50 text-emerald-700' },
  ditolak: { label: 'Ditolak', className: 'bg-rose-50 text-rose-700' },
}

/**
 * Warna per tahap alur pengajuan: diajukan (kuning) -> disetujui_divisi
 * (biru) -> revisi_qc (oranye, perlu perbaikan) / disetujui_qc (cyan) ->
 * disetujui_bendahara (hijau, final) / ditolak (merah, final).
 */
export default function PengajuanStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-600' }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
