import React, { useState } from 'react';
import { ObjectionStatus, ObjectionStatusType } from '@/types/evaluation';

interface Props {
  objectionStatus: ObjectionStatus;
  objectionDeadline?: string;
  correctionDeadline?: string;
  isSubmitting: boolean;
  onSubmit: (payload: { reason: string; requestedChanges: string; evidenceUrls?: string[] }) => Promise<void>;
}

const statusColor: Record<ObjectionStatusType, string> = {
  [ObjectionStatusType.NONE]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ObjectionStatusType.SUBMITTED]: 'bg-amber-50 text-amber-900 border-amber-200',
  [ObjectionStatusType.UNDER_REVIEW]: 'bg-blue-50 text-blue-900 border-blue-200',
  [ObjectionStatusType.RESOLVED]: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  [ObjectionStatusType.EXPIRED]: 'bg-gray-200 text-gray-700 border-gray-300',
};

const ObjectionSubmissionPanel: React.FC<Props> = ({
  objectionStatus,
  objectionDeadline,
  correctionDeadline,
  isSubmitting,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [evidence, setEvidence] = useState('');

  const handleSubmit = async () => {
    await onSubmit({
      reason,
      requestedChanges,
      evidenceUrls: evidence
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
    });
    setReason('');
    setRequestedChanges('');
    setEvidence('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Keberatan & Koreksi</h3>
          <p className="text-sm text-gray-700">Ajukan keberatan dalam batas waktu yang ditetapkan</p>
        </div>
        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${statusColor[objectionStatus.status]}`}>
          {objectionStatus.status.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Batas waktu keberatan</p>
          <p className="font-semibold">{objectionDeadline ? new Date(objectionDeadline).toLocaleString() : '-'}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Batas waktu koreksi</p>
          <p className="font-semibold">{correctionDeadline ? new Date(correctionDeadline).toLocaleString() : '-'}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-gray-800">Alasan Keberatan</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Contoh: Perhitungan denda tidak sesuai realisasi"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-800">Perubahan yang Diminta</label>
          <textarea
            value={requestedChanges}
            onChange={(e) => setRequestedChanges(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Contoh: Sesuaikan denda keterlambatan menjadi 5%"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-800">Bukti (URL, pisahkan dengan koma)</label>
          <input
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/bukti1, https://example.com/bukti2"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          <p>Diajukan oleh: {objectionStatus.submittedBy || 'Belum ada'}</p>
          <p>Terakhir: {objectionStatus.submittedAt ? new Date(objectionStatus.submittedAt).toLocaleString() : '-'}</p>
        </div>
        <button
          disabled={isSubmitting || !reason || !requestedChanges}
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Keberatan'}
        </button>
      </div>
    </div>
  );
};

export default ObjectionSubmissionPanel;
