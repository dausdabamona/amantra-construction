import React from 'react';
import { ArchiveSnapshot } from '@/types/archive';

interface Props {
  snapshot: ArchiveSnapshot;
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const FinalSummaryCard: React.FC<Props> = ({ snapshot }) => {
  const report = snapshot.finalReport;
  const finalRights: any = snapshot.finalRightsSnapshot?.finalRights || {};

  const totalFunds = report?.totalFunds ?? ((finalRights?.finalShareInvestor + finalRights?.finalShareOperator + (finalRights?.fees ?? 0) + (finalRights?.penalties ?? 0)) || undefined);
  const totalResult = report?.totalResult ?? 'Semua hak terpenuhi dan disalurkan';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Laporan Akhir</p>
          <h3 className="text-xl font-semibold text-gray-900">{report?.title || 'Final Summary'}</h3>
          <p className="text-sm text-gray-700 mt-1">Ringkasan singkat hasil akhir kontrak dan dana yang telah tersalurkan.</p>
        </div>
        <span className="text-xs text-gray-600">{report ? new Date(report.createdAt).toLocaleString() : 'Tidak ada laporan khusus'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Total Dana</p>
          <p className="font-semibold text-slate-900">{formatCurrency(totalFunds)}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Durasi</p>
          <p className="font-semibold text-slate-900">{report?.durationDays ? `${report.durationDays} hari` : 'Tidak tercatat'}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Hasil</p>
          <p className="font-semibold text-slate-900">{totalResult}</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">Ringkasan</p>
        <p className="mt-1 leading-relaxed">
          {report?.summary || 'Hak final disalurkan sesuai instruksi. Tidak ada kewajiban tersisa, kontrak siap dirujuk sebagai bukti historis.'}
        </p>
      </div>
    </div>
  );
};

export default FinalSummaryCard;
