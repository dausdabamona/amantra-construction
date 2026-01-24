import React from 'react';
import { DistributionWaitingState, TxStatus, FinalRights } from '@/types/distribution';

interface Props {
  waitingState: DistributionWaitingState;
  finalRights: FinalRights;
}

const badgeColor: Record<DistributionWaitingState, string> = {
  [DistributionWaitingState.WAITING_FOR_ESCROW_RELEASE]: 'bg-amber-100 text-amber-900 border-amber-300',
  [DistributionWaitingState.WAITING_FOR_TRANSFER_CONFIRMATION]: 'bg-indigo-100 text-indigo-900 border-indigo-300',
};

const statusColor: Record<TxStatus, string> = {
  [TxStatus.PENDING]: 'bg-amber-50 text-amber-900 border-amber-200',
  [TxStatus.CONFIRMED]: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  [TxStatus.FAILED]: 'bg-rose-50 text-rose-900 border-rose-200',
};

const ContractStatePanel: React.FC<Props> = ({ waitingState, finalRights }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">State</p>
          <h2 className="text-xl font-bold text-gray-900">RIGHTS_FINALIZED_AND_DISTRIBUTION</h2>
        </div>
        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${badgeColor[waitingState]}`}>
          {waitingState.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-semibold">Status TX</p>
          <p className={`text-lg font-bold ${statusColor[finalRights.txStatus]}`}>{finalRights.txStatus}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs text-indigo-900 font-semibold">Hash Perhitungan</p>
          <p className="text-xs text-indigo-900 break-all">{finalRights.calculationHash}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700">
        Distribusi bersifat final. Tidak ada perhitungan ulang atau perubahan hak kecuali melalui EXCEPTION_AND_FORCE_MAJEURE.
      </p>
    </div>
  );
};

export default ContractStatePanel;
