import React from 'react';
import { ArchiveSnapshot } from '@/types/archive';

interface Props {
  snapshot: ArchiveSnapshot;
}

const RightsObligationsHistoryTable: React.FC<Props> = ({ snapshot }) => {
  const finalRights = snapshot.finalRightsSnapshot?.finalRights;
  const instructions = snapshot.finalRightsSnapshot?.instructions ?? [];

  if (!finalRights || instructions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 text-center text-gray-600">
        <p>Tidak ada catatan final rights</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Rights & Obligations History</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
          <p className="text-xs text-indigo-600 font-semibold">Investor Share</p>
          <p className="text-lg font-bold text-indigo-900 mt-1">
            IDR {(finalRights.finalShareInvestor / 1e9).toFixed(2)}B
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-600 font-semibold">Operator Share</p>
          <p className="text-lg font-bold text-blue-900 mt-1">
            IDR {(finalRights.finalShareOperator / 1e9).toFixed(2)}B
          </p>
        </div>
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-xs text-orange-600 font-semibold">Fees</p>
          <p className="text-lg font-bold text-orange-900 mt-1">
            IDR {(finalRights.fees / 1e9).toFixed(2)}B
          </p>
        </div>
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-600 font-semibold">Penalties</p>
          <p className="text-lg font-bold text-red-900 mt-1">
            IDR {(finalRights.penalties / 1e9).toFixed(2)}B
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <p className="font-semibold text-gray-900">Distribution Instructions</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-xs font-semibold text-gray-700 px-2 py-2 text-left">Role</th>
                <th className="text-xs font-semibold text-gray-700 px-2 py-2 text-left">Beneficiary</th>
                <th className="text-xs font-semibold text-gray-700 px-2 py-2 text-right">Amount</th>
                <th className="text-xs font-semibold text-gray-700 px-2 py-2 text-left">Status</th>
                <th className="text-xs font-semibold text-gray-700 px-2 py-2 text-left">Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {instructions.map((instr, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2 text-xs font-semibold text-gray-900">{instr.role}</td>
                  <td className="px-2 py-2 text-xs text-gray-700">{instr.beneficiary}</td>
                  <td className="px-2 py-2 text-xs text-right font-semibold text-gray-900">
                    IDR {(instr.amount / 1e9).toFixed(2)}B
                  </td>
                  <td className="px-2 py-2 text-xs">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                      instr.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : instr.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {instr.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-600 break-all max-w-[100px]">
                    {instr.txHash ? instr.txHash.slice(0, 10) + '...' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RightsObligationsHistoryTable;
