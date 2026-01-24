import React from 'react';
import { CalculationLineItem, CalculationLineType } from '@/types/evaluation';

interface Props {
  items: CalculationLineItem[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const typeBadge = {
  [CalculationLineType.BASE_VALUE]: 'bg-blue-50 text-blue-800 border-blue-200',
  [CalculationLineType.DEDUCTION]: 'bg-red-50 text-red-800 border-red-200',
  [CalculationLineType.BONUS]: 'bg-green-50 text-green-800 border-green-200',
  [CalculationLineType.PENALTY]: 'bg-amber-50 text-amber-800 border-amber-200',
};

const CalculationBreakdownTable: React.FC<Props> = ({ items }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">Rincian Perhitungan</h3>
        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-800 border border-gray-200 rounded-full">Provisional</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Label</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Jumlah</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Jenis</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Dampak</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={`${item.label}-${idx}`} className="border-b border-gray-100">
                <td className="px-3 py-2 font-semibold text-gray-900">{item.label}</td>
                <td className="px-3 py-2 text-gray-800">{formatCurrency(item.amount)}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${typeBadge[item.type]}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-700">{item.impactOnPayment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalculationBreakdownTable;
