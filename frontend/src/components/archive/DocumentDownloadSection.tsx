import React from 'react';
import { ArchiveSnapshot } from '@/types/archive';

interface Props {
  snapshot: ArchiveSnapshot;
}

const DocumentDownloadSection: React.FC<Props> = ({ snapshot }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Documents & Downloads</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {snapshot.finalReport?.documentUrl && (
          <a
            href={snapshot.finalReport.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
          >
            <span className="text-2xl">📄</span>
            <div className="text-left">
              <p className="font-semibold text-blue-900">{snapshot.finalReport?.title || 'Final Report'}</p>
              <p className="text-xs text-blue-700">Download PDF</p>
            </div>
          </a>
        )}

        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">🔐 Archive Hash</p>
          <p className="text-[10px] text-gray-600 break-all font-mono bg-white p-2 rounded border border-gray-200">
            {snapshot.finalHash || '—'}
          </p>
        </div>

        {snapshot.transactionHashes.length > 0 && (
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <p className="font-semibold text-purple-900 mb-2">⛓️ Transaction Hashes ({snapshot.transactionHashes.length})</p>
            <div className="space-y-1 text-[10px]">
              {snapshot.transactionHashes.slice(0, 3).map((hash, idx) => (
                <p key={idx} className="text-purple-700 font-mono break-all">
                  {hash}
                </p>
              ))}
              {snapshot.transactionHashes.length > 3 && (
                <p className="text-purple-600 italic">+{snapshot.transactionHashes.length - 3} more</p>
              )}
            </div>
          </div>
        )}

        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="font-semibold text-green-900 mb-2">✅ Final State Snapshot</p>
          <p className="text-xs text-green-700">
            {Object.keys(snapshot.finalRightsSnapshot || {}).length} records archived
          </p>
          <button className="text-xs text-green-600 hover:text-green-800 font-semibold mt-2">
            View JSON →
          </button>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="font-semibold text-amber-900 mb-2">🔍 Audit Trail</p>
          <p className="text-xs text-amber-700">
            {snapshot.auditTrail.length} actions recorded
          </p>
          <button className="text-xs text-amber-600 hover:text-amber-800 font-semibold mt-2">
            View Full History →
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
        <p className="font-semibold text-slate-900 mb-1">⚠️ Archive Status</p>
        <p>
          Kontrak ini telah mencapai status terminal (STATE 6). Tidak ada modifikasi, pembukaan ulang, atau tindakan lebih lanjut dapat dilakukan pada kontrak ini. Semua data bersifat immutable dan read-only untuk keperluan audit dan referensi masa depan.
        </p>
      </div>
    </div>
  );
};

export default DocumentDownloadSection;
