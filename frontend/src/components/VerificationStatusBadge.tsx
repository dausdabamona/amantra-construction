import React, { useMemo } from 'react';
import { ProgressReport, ReportStatus, VerificationResultType } from '@/types/operation';

interface VerificationStatusBadgeProps {
  report: ProgressReport;
  className?: string;
  showDetails?: boolean;
}

/**
 * VerificationStatusBadge - Visual indicator of report verification status
 * Shows: Status badge, verification date, verified by, issues found
 */
export const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({
  report,
  className = '',
  showDetails = true,
}) => {
  // Determine status info
  const statusInfo = useMemo(() => {
    switch (report.status) {
      case ReportStatus.PENDING:
        return {
          icon: '⏳',
          label: 'Menunggu',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          badgeColor: 'bg-gray-200 text-gray-800',
          description: 'Laporan belum diajukan',
        };
      case ReportStatus.SUBMITTED:
        return {
          icon: '📤',
          label: 'Diajukan',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          badgeColor: 'bg-blue-200 text-blue-800',
          description: 'Laporan telah diajukan dan menunggu verifikasi',
        };
      case ReportStatus.VERIFIED:
        return {
          icon: '✅',
          label: 'Terverifikasi',
          color: 'bg-green-100 text-green-700 border-green-300',
          badgeColor: 'bg-green-200 text-green-800',
          description: 'Laporan telah disetujui dan milestone dianggap selesai',
        };
      case ReportStatus.REJECTED:
        return {
          icon: '❌',
          label: 'Ditolak',
          color: 'bg-red-100 text-red-700 border-red-300',
          badgeColor: 'bg-red-200 text-red-800',
          description: 'Laporan ditolak dan perlu diajukan ulang',
        };
      default:
        return {
          icon: '❓',
          label: 'Tidak Diketahui',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          badgeColor: 'bg-gray-200 text-gray-800',
          description: 'Status laporan tidak diketahui',
        };
    }
  }, [report.status]);

  // Compact Badge View
  const CompactBadge = (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${statusInfo.badgeColor}`}>
      <span>{statusInfo.icon}</span>
      <span>{statusInfo.label}</span>
    </div>
  );

  if (!showDetails) {
    return CompactBadge;
  }

  // Detailed View
  return (
    <div
      className={`border rounded-lg p-4 space-y-3 ${statusInfo.color} ${className}`}
    >
      {/* Status Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{statusInfo.icon}</span>
        <div className="flex-1">
          <h4 className="text-sm font-bold">{statusInfo.label}</h4>
          <p className="text-xs opacity-75">{statusInfo.description}</p>
        </div>
      </div>

      {/* Report Details */}
      <div className="bg-white/50 rounded p-3 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="font-semibold">Milestone:</span>
          <span>#{report.milestoneNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Diajukan:</span>
          <span>
            {new Date(report.submittedDate).toLocaleDateString('id-ID', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Oleh:</span>
          <span>{report.submittedBy}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Kemajuan:</span>
          <span className="font-bold">{report.completionPercentage}%</span>
        </div>
      </div>

      {/* Verification Details (if verified or rejected) */}
      {(report.status === ReportStatus.VERIFIED ||
        report.status === ReportStatus.REJECTED) &&
        report.verifiedDate && (
          <div className="bg-white/50 rounded p-3 space-y-2 text-xs border-t">
            <div className="font-semibold mb-2">Verifikasi:</div>
            <div className="flex justify-between">
              <span className="opacity-75">Diverifikasi oleh:</span>
              <span className="font-semibold">{report.verifiedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-75">Tanggal:</span>
              <span>
                {new Date(report.verifiedDate).toLocaleDateString('id-ID', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {report.verificationNotes && (
              <div className="mt-2 pt-2 border-t border-white/30">
                <p className="font-semibold mb-1">Catatan:</p>
                <p className="italic">{report.verificationNotes}</p>
              </div>
            )}
          </div>
        )}

      {/* Found Issues */}
      {report.status === ReportStatus.REJECTED &&
        report.foundIssues &&
        report.foundIssues.length > 0 && (
          <div className="bg-red-50 rounded p-3 space-y-2 text-xs border border-red-200">
            <p className="font-bold text-red-900 mb-2">Isu yang Ditemukan:</p>
            {report.foundIssues.map((issue, idx) => (
              <div key={idx} className="bg-white/60 rounded p-2 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-red-600 mt-0.5">
                    {issue.severity === 'CRITICAL' && '🔴'}
                    {issue.severity === 'HIGH' && '🟠'}
                    {issue.severity === 'MEDIUM' && '🟡'}
                    {issue.severity === 'LOW' && '🟢'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{issue.description}</p>
                    <p className="text-gray-700">
                      Tindakan: {issue.requiredAction}
                    </p>
                    {issue.targetResolutionDate && (
                      <p className="text-gray-600 mt-1">
                        Target perbaikan:{' '}
                        {new Date(issue.targetResolutionDate).toLocaleDateString(
                          'id-ID',
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Report Hash */}
      {report.reportHash && (
        <div className="bg-white/50 rounded p-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="font-semibold flex-shrink-0">Hash:</span>
            <code className="font-mono text-gray-600 break-all text-xs">
              {report.reportHash.substring(0, 16)}...
            </code>
          </div>
          <p className="text-gray-600 mt-1">
            🔐 Hash ini tersimpan di blockchain untuk integritas data
          </p>
        </div>
      )}

      {/* Submitted Photos Count */}
      {report.photos && report.photos.length > 0 && (
        <div className="bg-white/50 rounded p-2 text-xs">
          <span className="font-semibold">📸 Foto Bukti:</span> {report.photos.length} file
        </div>
      )}

      {/* Additional Notes */}
      {report.notes && (
        <div className="bg-white/50 rounded p-3 text-xs italic">
          <p className="font-semibold mb-1">Catatan Kontraktor:</p>
          <p>{report.notes}</p>
        </div>
      )}

      {/* Status-Specific Actions */}
      {report.status === ReportStatus.SUBMITTED && (
        <div className="bg-blue-50 rounded p-3 text-xs border-t pt-3 mt-2">
          <p className="text-blue-900">
            ⏳ Laporan ini sedang menunggu verifikasi dari ProjectOwner. Status akan
            diperbarui dalam 2-3 hari kerja.
          </p>
        </div>
      )}

      {report.status === ReportStatus.VERIFIED && (
        <div className="bg-green-50 rounded p-3 text-xs border-t pt-3 mt-2">
          <p className="text-green-900">
            ✅ Milestone telah terverifikasi. Tim siap melanjutkan ke tahap berikutnya.
          </p>
        </div>
      )}

      {report.status === ReportStatus.REJECTED && (
        <div className="bg-red-50 rounded p-3 text-xs border-t pt-3 mt-2">
          <p className="text-red-900 font-semibold mb-2">❌ Laporan Ditolak</p>
          <p className="text-red-800">
            Kontraktor perlu memperbaiki pekerjaan sesuai dengan isu yang ditemukan
            dan mengajukan ulang laporan.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationStatusBadge;
