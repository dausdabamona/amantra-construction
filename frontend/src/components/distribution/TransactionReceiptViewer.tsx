import React from 'react';
import { FinalRights, TxStatus } from '@/types/distribution';

interface Props {
  finalRights: FinalRights;
}

const txBadge: Record<TxStatus, string> = {
  [TxStatus.PENDING]: 'bg-amber-50 text-amber-900 border-amber-200',
  [TxStatus.CONFIRMED]: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  [TxStatus.FAILED]: 'bg-rose-50 text-rose-900 border-rose-200',
};

const TransactionReceiptViewer: React.FC<Props> = ({ finalRights }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Bukti Transaksi</h3>
        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${txBadge[finalRights.txStatus]}`}>
          {finalRights.txStatus}
        </span>
      </div>
      <div className="text-sm text-gray-800">
        <p className="font-semibold">Hash Perhitungan</p>
        <p className="break-all text-gray-700">{finalRights.calculationHash}</p>
      </div>
      <p className="text-xs text-gray-600">Gunakan hash ini sebagai referensi on-chain untuk distribusi. Tidak ada perubahan hak setelah tahap ini.</p>
    </div>
  );
};

export default TransactionReceiptViewer;
