import React from 'react';
import { DistributionInstruction } from '@/types/distribution';

interface Props {
  instructions: DistributionInstruction[];
}

const DistributionBreakdownTable: React.FC<Props> = ({ instructions }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">Rincian Distribusi</h3>
        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-800 border border-gray-200 rounded-full">Lock-in</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Penerima</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Peran</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Jumlah</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {instructions.map((item, idx) => (
              <tr key={`${item.beneficiary}-${idx}`} className="border-b border-gray-100">
                <td className="px-3 py-2 font-semibold text-gray-900">{item.beneficiary}</td>
                <td className="px-3 py-2 text-gray-800">{item.role}</td>
                <td className="px-3 py-2 text-gray-800">{item.amount.toLocaleString('id-ID')}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${item.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700 break-all">{item.txHash || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DistributionBreakdownTable;
