import React from 'react';
import { EvaluationWaitingState } from '@/types/evaluation';

interface Props {
  state: string;
  waitingState: EvaluationWaitingState;
  waitingFor: string;
  isDataFrozen: boolean;
  calculationHash?: string;
  objectionDeadline?: string;
  correctionDeadline?: string;
}

const badgeColor = {
  [EvaluationWaitingState.WAITING_FOR_AUDIT]: 'bg-amber-100 text-amber-800 border-amber-300',
  [EvaluationWaitingState.WAITING_FOR_CORRECTION]: 'bg-rose-100 text-rose-800 border-rose-300',
  [EvaluationWaitingState.WAITING_FOR_FINAL_APPROVAL]: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const ContractStatePanel: React.FC<Props> = ({
  state,
  waitingState,
  waitingFor,
  isDataFrozen,
  calculationHash,
  objectionDeadline,
  correctionDeadline,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">State</p>
          <h2 className="text-xl font-bold text-gray-900">{state}</h2>
        </div>
        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${badgeColor[waitingState]}`}>
          {waitingState.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-sm text-gray-600">Menunggu</p>
        <p className="text-base font-semibold text-gray-900">{waitingFor}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-semibold">Data Dibekukan</p>
          <p className="text-lg font-bold text-blue-900">{isDataFrozen ? 'Ya' : 'Belum'}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs text-indigo-900 font-semibold">Hash Perhitungan</p>
          <p className="text-xs text-indigo-900 break-all">{calculationHash || 'Belum dihitung'}</p>
        </div>
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        <div className="flex justify-between">
          <span>Batas waktu keberatan</span>
          <span className="font-semibold">{objectionDeadline ? new Date(objectionDeadline).toLocaleString() : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span>Batas waktu koreksi</span>
          <span className="font-semibold">{correctionDeadline ? new Date(correctionDeadline).toLocaleString() : '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default ContractStatePanel;
