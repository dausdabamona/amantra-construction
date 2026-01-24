import React from 'react';
import { TransferLogItem } from '@/types/distribution';

interface Props {
  logs: TransferLogItem[];
}

const iconForAction = (action: string) => {
  if (action === 'ESCROW_RELEASE') return '🔓';
  if (action === 'TRANSFER_EXECUTED') return '💸';
  if (action === 'DISTRIBUTION_COMPLETED') return '✅';
  return '•';
};

const ExecutionTimeline: React.FC<Props> = ({ logs }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Timeline Eksekusi</h3>
      <div className="space-y-3">
        {logs.map((log, idx) => (
          <div key={`${log.action}-${idx}`} className="flex items-start gap-3">
            <div className="mt-1 text-lg">{iconForAction(log.action)}</div>
            <div className="flex-1 border-b border-gray-100 pb-2">
              <div className="flex justify-between text-sm text-gray-800">
                <span className="font-semibold">{log.action}</span>
                <span className="text-xs text-gray-600">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700">{log.message}</p>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Status: {log.status}</span>
                <span className="break-all">{log.txHash || '-'}</span>
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-sm text-gray-600">Belum ada eksekusi</p>}
      </div>
    </div>
  );
};

export default ExecutionTimeline;
