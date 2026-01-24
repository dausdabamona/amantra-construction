import React from 'react';
import { ClauseReferenceItem } from '@/types/evaluation';

interface Props {
  clauses: ClauseReferenceItem[];
}

const ClauseReferenceViewer: React.FC<Props> = ({ clauses }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Klausul Kontrak yang Diterapkan</h3>
        <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full">
          Binding
        </span>
      </div>

      <div className="space-y-3">
        {clauses.map((clause) => (
          <div key={clause.clauseId} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">{clause.clauseId} • {clause.title}</p>
              <span className="text-xs bg-gray-200 text-gray-800 rounded-full px-2 py-1">{clause.appliedReason}</span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{clause.description}</p>
            <p className="text-sm text-gray-900 font-semibold">Dampak: {clause.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClauseReferenceViewer;
