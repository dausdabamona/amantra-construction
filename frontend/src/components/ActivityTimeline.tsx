import React from 'react';
import { useActivityTimeline } from '@/stores/useOperationStore';
import { ActivityType } from '@/types/operation';

interface ActivityTimelineProps {
  className?: string;
  maxItems?: number;
}

/**
 * ActivityTimeline - Display immutable audit trail of all operation activities
 * Shows: Chronological list of all state changes, submissions, verifications
 */
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  className = '',
  maxItems = 10,
}) => {
  const timeline = useActivityTimeline();
  const displayItems = timeline.slice(0, maxItems);

  const getActivityIcon = (type: ActivityType) => {
    const icons = {
      [ActivityType.OPERATION_STARTED]: '🚀',
      [ActivityType.REPORT_SUBMITTED]: '📤',
      [ActivityType.REPORT_VERIFIED]: '✅',
      [ActivityType.REPORT_REJECTED]: '❌',
      [ActivityType.REPORT_REVISION_REQUESTED]: '✏️',
      [ActivityType.MILESTONE_COMPLETED]: '🎉',
      [ActivityType.DEADLINE_APPROACHING]: '⏰',
      [ActivityType.DEADLINE_PASSED]: '🚨',
      [ActivityType.VERIFICATION_REQUIRED]: '👁️',
      [ActivityType.STATE_ADVANCED]: '➡️',
    };
    return icons[type] || '📌';
  };

  const getActivityColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'border-green-300 bg-green-50',
      warning: 'border-amber-300 bg-amber-50',
      error: 'border-red-300 bg-red-50',
      info: 'border-blue-300 bg-blue-50',
    };
    return colors[status] || colors.info;
  };

  const getActivityStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ',
    };
    return icons[status] || '•';
  };

  const getActivityStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'text-green-600',
      warning: 'text-amber-600',
      error: 'text-red-600',
      info: 'text-blue-600',
    };
    return colors[status] || 'text-gray-600';
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className={`border rounded-lg bg-gray-50 border-gray-300 p-6 ${className}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline Aktivitas</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">Belum ada aktivitas yang tercatat</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg bg-white border-gray-300 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Timeline Aktivitas</h3>
        <p className="text-xs text-gray-600 mt-1">
          Jejak audit terverifikasi dari semua aktivitas kontrak. Ini bersifat permanen dan tidak
          dapat diubah.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <div key={item.id || index} className="relative">
            {/* Timeline Line (not for last item) */}
            {index < displayItems.length - 1 && (
              <div className="absolute left-5 top-14 w-0.5 h-8 bg-gray-200"></div>
            )}

            {/* Timeline Item */}
            <div
              className={`border rounded-lg p-4 flex gap-4 ${getActivityColor(item.status)}`}
            >
              {/* Timeline Dot */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-4 border-gray-300">
                  <span className="text-lg">{getActivityIcon(item.activityType)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      {item.description}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{item.activityType}</p>
                  </div>
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getActivityStatusColor(item.status)} bg-white`}
                  >
                    {getActivityStatusIcon(item.status)}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">👤 Aktor:</span>
                    <span>{item.actor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">🕐 Waktu:</span>
                    <span>
                      {new Date(item.timestamp).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {item.reference && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">📌 Referensi:</span>
                      <span className="font-mono text-gray-700">{item.reference}</span>
                    </div>
                  )}

                  {item.details && Object.keys(item.details).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      {Object.entries(item.details).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-semibold min-w-max">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-gray-700">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Link */}
      {timeline.length > maxItems && (
        <div className="mt-6 text-center">
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
            Tampilkan {timeline.length - maxItems} aktivitas lainnya →
          </button>
        </div>
      )}

      {/* Audit Trail Certification */}
      <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded p-3">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">🔐 Jejak Audit Terverifikasi:</span> Semua aktivitas
          yang tercatat di atas bersifat permanen dan telah dipetikkan ke blockchain untuk
          integritas data. Tidak ada aktivitas yang dapat diubah atau dihapus.
        </p>
      </div>
    </div>
  );
};

export default ActivityTimeline;
