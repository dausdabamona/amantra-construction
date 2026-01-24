import React from 'react';
import { VerifiedPerformanceItem } from '@/types/evaluation';

interface Props {
  items: VerifiedPerformanceItem[];
}

const DataVerificationTable: React.FC<Props> = ({ items }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">Data Kinerja Terverifikasi</h3>
        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
          Dibekukan
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Milestone</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Nilai Rencana</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Nilai Aktual</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Deviasi</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Diverifikasi Oleh</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.milestoneNumber} className="border-b border-gray-100">
                <td className="px-3 py-2 font-semibold text-gray-900">#{item.milestoneNumber}</td>
                <td className="px-3 py-2 text-gray-800">{item.plannedValue.toLocaleString('id-ID')} {item.unit}</td>
                <td className="px-3 py-2 text-gray-800">{item.actualValue.toLocaleString('id-ID')} {item.unit}</td>
                <td className="px-3 py-2 text-gray-800">{item.deviation.toLocaleString('id-ID')} {item.unit}</td>
                <td className="px-3 py-2 text-gray-800">{item.verifiedBy}</td>
                <td className="px-3 py-2 text-gray-800">{new Date(item.verifiedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataVerificationTable;
