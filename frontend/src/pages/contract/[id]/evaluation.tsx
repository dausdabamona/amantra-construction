import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ContractStatePanel from '@/components/evaluation/ContractStatePanel';
import RightsObligationsPanel from '@/components/evaluation/RightsObligationsPanel';
import DataVerificationTable from '@/components/evaluation/DataVerificationTable';
import ClauseReferenceViewer from '@/components/evaluation/ClauseReferenceViewer';
import CalculationBreakdownTable from '@/components/evaluation/CalculationBreakdownTable';
import ObjectionSubmissionPanel from '@/components/evaluation/ObjectionSubmissionPanel';
import {
  useEvaluationStore,
  useEvaluationLoading,
  useEvaluationError,
  useEvaluationData,
} from '@/stores/useEvaluationStore';
import {
  CalculationLineItem,
  EvaluationApiResponse,
  EvaluationData,
  EvaluationWaitingState,
  ObjectionRequest,
  ObjectionStatusType,
  CalculationRequest,
} from '@/types/evaluation';

const EvaluationPage = () => {
  const router = useRouter();
  const { id: contractId } = router.query;
  const store = useEvaluationStore();
  const loading = useEvaluationLoading();
  const error = useEvaluationError();
  const evaluationData = useEvaluationData();

  const [isStarting, setIsStarting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmittingObjection, setIsSubmittingObjection] = useState(false);

  // Fetch evaluation data
  useEffect(() => {
    if (!contractId) return;
    const fetchData = async () => {
      store.setLoading(true);
      try {
        const response = await axios.get<EvaluationApiResponse<EvaluationData>>(
          `/api/contract/${contractId}/evaluation/data`,
        );
        store.setData(response.data);
        store.setError(null);
      } catch (err: any) {
        store.setError(
          err.response?.data?.message ||
            'Gagal mengambil data evaluasi. Pastikan kontrak sudah memasuki fase operasi.',
        );
      } finally {
        store.setLoading(false);
      }
    };
    fetchData();
  }, [contractId, store]);

  const handleStartEvaluation = async () => {
    if (!contractId) return;
    setIsStarting(true);
    try {
      const response = await axios.post<EvaluationApiResponse<EvaluationData>>(
        `/api/contract/${contractId}/evaluation/start`,
        { confirmStart: true },
      );
      store.setData(response.data);
      alert('✅ Evaluasi dimulai. Data dibekukan dan siap dihitung.');
    } catch (err: any) {
      store.setError(
        err.response?.data?.message ||
          'Gagal memulai evaluasi. Pastikan semua milestone telah diverifikasi.',
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleCalculate = async () => {
    if (!contractId) return;
    setIsCalculating(true);
    try {
      const payload: CalculationRequest = {
        applyRiskAdjustments: true,
        manualAdjustments: [],
      };
      const response = await axios.post<EvaluationApiResponse<EvaluationData>>(
        `/api/contract/${contractId}/evaluation/calculate`,
        payload,
      );
      store.setData(response.data);
      alert('📊 Perhitungan provisional berhasil dibuat. Menunggu persetujuan final.');
    } catch (err: any) {
      store.setError(
        err.response?.data?.message ||
          'Gagal menghitung provisional. Pastikan evaluasi sudah dimulai.',
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmitObjection = async (payload: ObjectionRequest) => {
    if (!contractId) return;
    setIsSubmittingObjection(true);
    try {
      const response = await axios.post<EvaluationApiResponse<any>>(
        `/api/contract/${contractId}/evaluation/objection`,
        payload,
      );
      store.updateObjection({
        ...response.data.data,
        status: ObjectionStatusType.SUBMITTED,
      });
      alert('🛑 Keberatan telah dicatat. Menunggu koreksi.');
    } catch (err: any) {
      store.setError(
        err.response?.data?.message || 'Gagal mengirim keberatan. Coba lagi.',
      );
    } finally {
      setIsSubmittingObjection(false);
    }
  };

  if (loading && !evaluationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white border border-gray-200 rounded-lg shadow p-6 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Memuat data evaluasi...</p>
        </div>
      </div>
    );
  }

  if (error && !evaluationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6 max-w-xl">
          <h2 className="text-lg font-bold text-red-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
            onClick={() => window.location.reload()}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!evaluationData) return null;

  const breakdownSum = (evaluationData.calculationBreakdown || []).reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 pb-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">State 4</p>
              <h1 className="text-3xl font-bold text-gray-900">Evaluation & Calculation</h1>
              <p className="text-gray-700 mt-1">
                Semua data operasi dibekukan. Tampilkan data yang digunakan, aturan yang diterapkan, hasil provisional, dan kondisi menunggu finalisasi.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStartEvaluation}
                disabled={isStarting || evaluationData.isDataFrozen}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow"
              >
                {isStarting ? 'Memulai...' : 'Mulai Evaluasi'}
              </button>
              <button
                onClick={handleCalculate}
                disabled={isCalculating || !evaluationData.isDataFrozen}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow"
              >
                {isCalculating ? 'Menghitung...' : 'Hitung Provisional'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            <strong>Catatan:</strong> Tidak ada pelepasan dana, klaim, atau penarikan sebelum finalisasi. Hasil saat ini bersifat provisional.
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ContractStatePanel
            state={evaluationData.state}
            waitingState={evaluationData.waitingState}
            waitingFor={evaluationData.waitingFor}
            isDataFrozen={evaluationData.isDataFrozen}
            calculationHash={evaluationData.calculationHash}
            objectionDeadline={evaluationData.objectionDeadline}
            correctionDeadline={evaluationData.correctionDeadline}
          />

          <RightsObligationsPanel provisional={evaluationData.provisionalResults} />

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Ringkasan Hitungan</h3>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Jumlah baris</span>
              <span className="font-semibold">{evaluationData.calculationBreakdown.length}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Total nominal</span>
              <span className="font-semibold">{breakdownSum.toLocaleString('id-ID')}</span>
            </div>
            <p className="text-xs text-gray-600">
              Hanya dapat difinalisasi ketika hash perhitungan sudah di-anchored dan semua keberatan telah diselesaikan.
            </p>
          </div>
        </div>

        <DataVerificationTable items={evaluationData.verifiedPerformanceData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClauseReferenceViewer clauses={evaluationData.appliedContractClauses} />
          <CalculationBreakdownTable items={evaluationData.calculationBreakdown as CalculationLineItem[]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ObjectionSubmissionPanel
            objectionStatus={evaluationData.objectionStatus}
            objectionDeadline={evaluationData.objectionDeadline}
            correctionDeadline={evaluationData.correctionDeadline}
            isSubmitting={isSubmittingObjection}
            onSubmit={async (payload) => handleSubmitObjection(payload)}
          />

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Audit Trail</h3>
            <div className="space-y-2 text-sm text-gray-800">
              {evaluationData.auditTrail.map((log, idx) => (
                <div key={`${log.action}-${idx}`} className="flex justify-between border-b border-gray-100 pb-1">
                  <div>
                    <p className="font-semibold text-gray-900">{log.action}</p>
                    <p className="text-gray-700">{log.description}</p>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                    <p>{log.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationPage;
