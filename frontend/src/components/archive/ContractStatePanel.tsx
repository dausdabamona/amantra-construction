import React from 'react';
import { ArchiveSnapshot } from '@/types/archive';

interface Props {
  snapshot: ArchiveSnapshot;
}

const ContractStatePanel: React.FC<Props> = ({ snapshot }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">State 6</p>
          <h2 className="text-2xl font-bold text-gray-900">Contract Closed & Archived</h2>
          <p className="text-sm text-gray-700 mt-1">
            Kontrak bersifat read-only. Semua hak dan kewajiban telah dipenuhi dan dicatat secara immutable.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
          {snapshot.finalState}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Archived At</p>
          <p className="font-semibold text-slate-900">{new Date(snapshot.archivedAt).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Closed By</p>
          <p className="font-semibold text-slate-900">{snapshot.closedBy || 'System/Unknown'}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500">Distribution Status</p>
          <p className="font-semibold text-slate-900">
            {snapshot.distributionCompleted ? '✅ Semua transfer dikonfirmasi' : 'Menunggu konfirmasi transfer'}
          </p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-white border border-dashed border-gray-300 text-xs text-gray-700 break-all">
        <p className="font-semibold text-gray-900">Final Hash</p>
        <p className="mt-1">{snapshot.finalHash || '—'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700">
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">Transaction Hashes</p>
          {snapshot.transactionHashes.length === 0 ? (
            <p className="text-gray-600">Belum ada hash yang direkam.</p>
          ) : (
            <ul className="space-y-1">
              {snapshot.transactionHashes.map((hash) => (
                <li key={hash} className="flex items-center gap-2">
                  <span className="text-[10px] bg-gray-200 text-gray-800 px-2 py-1 rounded">
                    {hash}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
          <p className="font-semibold">Read-only Guard</p>
          <p className="mt-1 text-xs">
            Perubahan apa pun (re-open, re-distribute) akan ditolak. Gunakan kontrak baru untuk revisi lanjutan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContractStatePanel;
