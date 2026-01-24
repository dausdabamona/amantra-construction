import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ContractStatePanel from '@/components/archive/ContractStatePanel';
import FinalSummaryCard from '@/components/archive/FinalSummaryCard';
import RightsObligationsHistoryTable from '@/components/archive/RightsObligationsHistoryTable';
import FullTimelineViewer from '@/components/archive/FullTimelineViewer';
import DocumentDownloadSection from '@/components/archive/DocumentDownloadSection';
import {
  useArchiveSnapshot,
  useArchiveLoading,
  useArchiveError,
  useArchiveStore,
} from '@/stores/useArchiveStore';
import { ArchiveApiResponse, ArchiveSnapshot } from '@/types/archive';

const ArchivePage = () => {
  const router = useRouter();
  const { id: contractId } = router.query;

  const snapshot = useArchiveSnapshot();
  const loading = useArchiveLoading();
  const error = useArchiveError();
  const store = useArchiveStore();

  useEffect(() => {
    if (!contractId) return;

    const fetchArchive = async () => {
      store.setLoading(true);
      try {
        const response = await axios.get<ArchiveApiResponse<ArchiveSnapshot>>(
          `/api/contract/${contractId}/archive`,
        );
        store.setData(response.data);
      } catch (err: any) {
        const message = err.response?.data?.message || 'Gagal mengambil arsip kontrak.';
        store.setError(message);
      } finally {
        store.setLoading(false);
      }
    };

    fetchArchive();
  }, [contractId, store]);

  if (loading && !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white border border-gray-200 rounded-lg shadow p-6 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Memuat arsip kontrak...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 pb-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">State 6</p>
            <h1 className="text-3xl font-bold text-gray-900">Contract Closed & Archived</h1>
            <p className="text-gray-700 mt-1">
              Kontrak berada dalam status terminal (read-only). Semua hak dan kewajiban telah dipenuhi.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-900">
              ⚠️ {error}
            </div>
          )}
        </div>

        {!snapshot ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-700">
            {error ? (
              <p>Tidak dapat memuat arsip kontrak. Silakan coba lagi.</p>
            ) : (
              <p>Memuat arsip...</p>
            )}
          </div>
        ) : (
          <>
            <ContractStatePanel snapshot={snapshot} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FinalSummaryCard snapshot={snapshot} />
              </div>
              <div>
                <FullTimelineViewer snapshot={snapshot} />
              </div>
            </div>

            <RightsObligationsHistoryTable snapshot={snapshot} />

            <DocumentDownloadSection snapshot={snapshot} />

            {/* Audit Trail Section */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Audit Trail (Last 20)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {snapshot.auditTrail.slice(0, 20).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 text-xs">
                    <span className="text-sm">📋</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.action}</p>
                      <p className="text-gray-600">{item.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString('id-ID')}
                      </p>
                    </div>
                    {item.txHash && (
                      <span className="text-[10px] bg-gray-200 text-gray-800 px-2 py-1 rounded font-mono break-all">
                        {item.txHash.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
