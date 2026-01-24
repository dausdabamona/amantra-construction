import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ContractStatePanel from '@/components/distribution/ContractStatePanel';
import RightsObligationsPanel from '@/components/distribution/RightsObligationsPanel';
import DistributionBreakdownTable from '@/components/distribution/DistributionBreakdownTable';
import ExecutionTimeline from '@/components/distribution/ExecutionTimeline';
import TransactionReceiptViewer from '@/components/distribution/TransactionReceiptViewer';
import {
  useDistributionStore,
  useDistributionLoading,
  useDistributionError,
  useDistributionStatus,
} from '@/stores/useDistributionStore';
import {
  DistributionApiResponse,
  DistributionStatus,
  DistributionWaitingState,
} from '@/types/distribution';

const DistributionPage = () => {
  const router = useRouter();
  const { id: contractId } = router.query;
  const store = useDistributionStore();
  const loading = useDistributionLoading();
  const error = useDistributionError();
  const status = useDistributionStatus();

  const [isPreparing, setIsPreparing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    const fetchStatus = async () => {
      store.setLoading(true);
      try {
        const response = await axios.get<DistributionApiResponse<DistributionStatus>>(
          `/api/contract/${contractId}/distribution/status`,
        );
        store.setData(response.data);
      } catch (err: any) {
        store.setError(err.response?.data?.message || 'Gagal mengambil status distribusi.');
      } finally {
        store.setLoading(false);
      }
    };
    fetchStatus();
  }, [contractId, store]);

  const handlePrepare = async () => {
    if (!contractId) return;
    setIsPreparing(true);
    try {
      const response = await axios.post<DistributionApiResponse<DistributionStatus>>(
        `/api/contract/${contractId}/distribution/prepare`,
        { confirm: true },
      );
      store.setData(response.data);
      alert('✅ Instruksi distribusi siap. Dana tetap terkunci hingga dieksekusi.');
    } catch (err: any) {
      store.setError(err.response?.data?.message || 'Gagal menyiapkan distribusi.');
    } finally {
      setIsPreparing(false);
    }
  };

  const handleExecute = async () => {
    if (!contractId) return;
    setIsExecuting(true);
    try {
      const response = await axios.post<DistributionApiResponse<DistributionStatus>>(
        `/api/contract/${contractId}/distribution/execute`,
        {},
      );
      store.setData(response.data);
      alert('💸 Distribusi dijalankan. Menunggu konfirmasi akhir.');
    } catch (err: any) {
      store.setError(err.response?.data?.message || 'Gagal mengeksekusi distribusi.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white border border-gray-200 rounded-lg shadow p-6 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Memuat status distribusi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 pb-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">State 5</p>
              <h1 className="text-3xl font-bold text-gray-900">Rights Finalized & Distribution</h1>
              <p className="text-gray-700 mt-1">
                Hak final telah ditetapkan. Distribusi dilakukan sesuai instruksi yang tidak dapat diubah.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrepare}
                disabled={isPreparing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow"
              >
                {isPreparing ? 'Menyiapkan...' : 'Siapkan Distribusi'}
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting || !status}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow"
              >
                {isExecuting ? 'Mengeksekusi...' : 'Eksekusi Distribusi'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            <strong>Catatan:</strong> Tidak ada modifikasi hak atau perhitungan ulang di tahap ini. Distribusi hanya dapat dibatalkan via EXCEPTION_AND_FORCE_MAJEURE.
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-900">⚠️ {error}</div>
          )}
        </div>

        {!status ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-700">
            Tekan "Siapkan Distribusi" untuk mengunci hak final dan membuat instruksi transfer.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ContractStatePanel waitingState={status.waitingState} finalRights={status.finalRights} />
              <RightsObligationsPanel finalRights={status.finalRights} />
              <TransactionReceiptViewer finalRights={status.finalRights} />
            </div>

            <DistributionBreakdownTable instructions={status.instructions} />

            <ExecutionTimeline logs={status.logs} />
          </>
        )}
      </div>
    </div>
  );
};

export default DistributionPage;
