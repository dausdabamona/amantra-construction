import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ContractStatePanel from '@/components/ContractStatePanel';
import RightsObligationsPanel from '@/components/RightsObligationsPanel';
import NextConditionPanel from '@/components/NextConditionPanel';
import ActivityTimeline from '@/components/ActivityTimeline';
import ReportSubmissionForm from '@/components/ReportSubmissionForm';
import VerificationStatusBadge from '@/components/VerificationStatusBadge';
import {
  useOperationStore,
  useOperationLoading,
  useOperationError,
  useSubmittedReports,
} from '@/stores/useOperationStore';
import { ProgressReportInput, OperationProgress } from '@/types/operation';

/**
 * Operation Page - Main interface for contract operation state
 * Route: /contract/[id]/operation
 * Displays: 3-column layout with state info, conditions, and activity timeline
 */
export default function OperationPage() {
  const router = useRouter();
  const { id: contractId } = router.query;
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const store = useOperationStore();
  const loading = useOperationLoading();
  const error = useOperationError();
  const submittedReports = useSubmittedReports();

  // Fetch operation data on mount
  useEffect(() => {
    if (!contractId) return;

    const fetchOperation = async () => {
      store.setLoading(true);
      try {
        const response = await axios.get<OperationProgress>(
          `/api/contract/${contractId}/operation`,
        );
        store.setOperationData(response.data);
        store.setError(null);
      } catch (err: any) {
        store.setError(
          err.response?.data?.message ||
          'Gagal mengambil data operasi. Silakan coba lagi.',
        );
      } finally {
        store.setLoading(false);
      }
    };

    fetchOperation();
  }, [contractId, store]);

  // Handle start operation
  const handleStartOperation = async () => {
    if (!contractId) return;

    setIsStarting(true);
    try {
      const response = await axios.post(`/api/contract/${contractId}/operation/start`, {
        confirmOperationStart: true,
        scheduledStartTime: new Date(),
      });

      store.setOperationData(response.data.data);
      store.setError(null);

      // Show success notification
      alert('✅ Operasi konstruksi berhasil dimulai!');
    } catch (err: any) {
      store.setError(
        err.response?.data?.message ||
        'Gagal memulai operasi. Silakan coba lagi.',
      );
    } finally {
      setIsStarting(false);
    }
  };

  // Handle submit report
  const handleSubmitReport = async (data: ProgressReportInput) => {
    if (!contractId) return;

    setIsSubmittingReport(true);
    try {
      const response = await axios.post(`/api/contract/${contractId}/operation/report`, {
        ...data,
      });

      // Update store with new report
      if (store.operationData) {
        store.addReport(response.data.data);
        store.toggleReportForm();
      }

      alert('✅ Laporan berhasil dikirim dan menunggu verifikasi!');
    } catch (err: any) {
      store.setError(
        err.response?.data?.message ||
        'Gagal mengirim laporan. Silakan coba lagi.',
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Loading state
  if (loading && !store.operationData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-600 font-semibold">Memuat data operasi...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !store.operationData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-300 rounded-lg shadow-lg p-8">
            <h2 className="text-lg font-bold text-red-900 mb-2">❌ Terjadi Kesalahan</h2>
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Data not loaded
  if (!store.operationData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 border border-gray-300 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 font-semibold">Tidak ada data operasi tersedia</p>
          </div>
        </div>
      </div>
    );
  }

  const operationState = store.operationData.operationState;

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Operasi Konstruksi - Kontrak {contractId}
          </h1>
          <p className="text-gray-600 mt-2">
            Pantau kemajuan proyek, laporan pekerjaan, dan verifikasi milestone
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-900">⚠️ {error}</p>
          </div>
        )}

        {/* Start Operation Section (if not started) */}
        {operationState.state !== 'OPERATION_RUNNING' && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-3">
              🚀 Mulai Operasi Konstruksi
            </h2>
            <p className="text-blue-800 mb-4">
              Klik tombol di bawah untuk memulai fase operasi. Tindakan ini menandakan
              komitmen untuk melaksanakan pekerjaan sesuai jadwal dan kontrak.
            </p>
            <button
              onClick={handleStartOperation}
              disabled={isStarting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 transition flex items-center gap-2"
            >
              {isStarting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Memulai Operasi...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Mulai Operasi
                </>
              )}
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: State & Conditions */}
          <div className="lg:col-span-1 space-y-6">
            <ContractStatePanel />
            <NextConditionPanel />
          </div>

          {/* Middle Column: Rights & Obligations */}
          <div className="lg:col-span-1">
            <RightsObligationsPanel />
          </div>

          {/* Right Column: Activity Timeline */}
          <div className="lg:col-span-1">
            <ActivityTimeline maxItems={8} />
          </div>
        </div>

        {/* Report Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Submission Form */}
          <div>
            <ReportSubmissionForm
              contractId={contractId as string}
              onSubmit={handleSubmitReport}
              onCancel={() => store.toggleReportForm()}
              isLoading={isSubmittingReport}
            />
          </div>

          {/* Submitted Reports */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Laporan yang Diajukan</h3>
            {submittedReports.length === 0 ? (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-600 text-sm">Belum ada laporan yang diajukan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submittedReports.map((report) => (
                  <VerificationStatusBadge
                    key={report.reportId}
                    report={report}
                    showDetails={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Milestones Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Milestone Proyek</h2>
          <div className="space-y-3">
            {operationState.milestones.map((milestone) => (
              <div
                key={milestone.milestoneNumber}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">
                      Milestone {milestone.milestoneNumber}: {milestone.description}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {milestone.percentageOfContract}% dari total ({milestone.amount.toLocaleString('id-ID')} IDR)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {milestone.currentProgress}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Target: {new Date(milestone.targetCompletionDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      milestone.status === 'VERIFIED'
                        ? 'bg-green-500'
                        : milestone.status === 'SUBMITTED'
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                    }`}
                    style={{ width: `${milestone.currentProgress}%` }}
                  ></div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-700">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full font-bold ${
                      milestone.status === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : milestone.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {milestone.status === 'VERIFIED' && '✅ Terverifikasi'}
                    {milestone.status === 'SUBMITTED' && '📤 Diajukan'}
                    {milestone.status === 'PENDING' && '⏳ Menunggu'}
                  </span>
                </div>

                {/* Deliverables */}
                {milestone.deliverables.length > 0 && (
                  <div className="bg-gray-50 rounded p-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-700">Deliverables:</p>
                    <ul className="space-y-1">
                      {milestone.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <span className={item.completed ? '✓' : '-'}>
                            {item.completed ? '✅' : '⚪'}
                          </span>
                          <span className={item.completed ? 'line-through text-gray-500' : ''}>
                            {item.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overdue Warning */}
                {milestone.isOverdue && (
                  <div className="bg-red-50 border border-red-300 rounded p-2">
                    <p className="text-xs font-bold text-red-800">
                      ⚠️ Milestone ini sudah {milestone.daysOverdue} hari tertunda
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center text-xs text-gray-600">
          <p>
            💡 Semua aktivitas tercatat dan tersimpan di blockchain untuk keperluan audit
            dan transparansi. Tidak ada yang dapat diubah atau dihapus.
          </p>
        </div>
      </div>
    </div>
  );
}
