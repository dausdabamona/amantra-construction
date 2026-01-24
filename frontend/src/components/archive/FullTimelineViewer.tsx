import React from 'react';
import { ArchiveSnapshot } from '@/types/archive';

interface Props {
  snapshot: ArchiveSnapshot;
}

const FullTimelineViewer: React.FC<Props> = ({ snapshot }) => {
  const phaseTs = snapshot.phaseTimestamps;

  const timeline = [
    { label: 'Intent Declared', timestamp: phaseTs.intentDeclaredAt },
    { label: 'Contract Locked', timestamp: phaseTs.lockedAt },
    { label: 'Operation Started', timestamp: phaseTs.operationStartedAt },
    { label: 'Evaluation Started', timestamp: phaseTs.evaluationStartedAt },
    { label: 'Rights Finalized', timestamp: phaseTs.rightsFinalizedAt },
    { label: 'Distribution Prepared', timestamp: phaseTs.distributionPreparedAt },
    { label: 'Distribution Executed', timestamp: phaseTs.distributionExecutedAt },
    { label: 'Distribution Completed', timestamp: phaseTs.distributionCompletedAt },
    { label: 'Contract Archived', timestamp: phaseTs.archivedAt },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Full Timeline</h3>

      <div className="space-y-3">
        {timeline.map((item, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  item.timestamp ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-300'
                }`}
              />
              {idx < timeline.length - 1 && (
                <div className="w-1 h-8 bg-gray-200 mt-1" />
              )}
            </div>
            <div className="flex-1 py-1">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-600">
                {item.timestamp
                  ? new Date(item.timestamp).toLocaleString('id-ID', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '(Not reached)'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FullTimelineViewer;
