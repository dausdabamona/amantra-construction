import React from 'react';
import { FinalRights } from '@/types/distribution';

interface Props {
  finalRights: FinalRights;
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

const RightsObligationsPanel: React.FC<Props> = ({ finalRights }) => {
  const total = finalRights.finalShareInvestor + finalRights.finalShareOperator + finalRights.fees + finalRights.penalties;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Hak & Kewajiban (Final)</p>
          <h2 className="text-xl font-bold text-gray-900">Tidak dapat diubah</h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm font-semibold">
          Final
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-900 font-semibold">Bagian Investor</p>
          <p className="text-lg font-bold text-green-900">{formatCurrency(finalRights.finalShareInvestor, finalRights.currency)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-semibold">Bagian Operator</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(finalRights.finalShareOperator, finalRights.currency)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-900 font-semibold">Biaya</p>
          <p className="text-lg font-bold text-amber-900">{formatCurrency(finalRights.fees, finalRights.currency)}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <p className="text-xs text-rose-900 font-semibold">Penalti</p>
          <p className="text-lg font-bold text-rose-900">{formatCurrency(finalRights.penalties, finalRights.currency)}</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800">
        <div className="flex justify-between">
          <span>Total Distribusi</span>
          <span className="font-semibold">{formatCurrency(total, finalRights.currency)}</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">Urutan distribusi: Escrow release → Transfer ke investor → Transfer ke operator → Fee/Penalty.</p>
      </div>
    </div>
  );
};

export default RightsObligationsPanel;
