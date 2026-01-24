import React from 'react';
import { ProvisionalResult } from '@/types/evaluation';

interface Props {
  provisional: ProvisionalResult;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const RightsObligationsPanel: React.FC<Props> = ({ provisional }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Hak & Kewajiban (Provisional)</p>
          <h2 className="text-xl font-bold text-gray-900">Belum final • Menunggu persetujuan</h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-sm font-semibold">
          Provisional
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-900 font-semibold">Dasar Pembayaran</p>
          <p className="text-lg font-bold text-green-900">{formatCurrency(provisional.grossPayable)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-900 font-semibold">Total Pengurangan</p>
          <p className="text-lg font-bold text-red-900">{formatCurrency(provisional.totalDeductions)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-xs text-emerald-900 font-semibold">Total Bonus</p>
          <p className="text-lg font-bold text-emerald-900">{formatCurrency(provisional.totalBonuses)}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs text-indigo-900 font-semibold">Pembayaran Bersih</p>
          <p className="text-lg font-bold text-indigo-900">{formatCurrency(provisional.netPayable)}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700">
        Hasil ini masih provisional dan dapat berubah jika terdapat keberatan yang valid atau koreksi tambahan sebelum finalisasi.
      </p>
    </div>
  );
};

export default RightsObligationsPanel;
