import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useContractReviewStore } from '@/hooks/useContractReviewStore';
import { SummaryView } from '@/components/contract-review/SummaryView';
import { ProcessTimelineView } from '@/components/contract-review/ProcessTimelineView';
import { RiskAndConsequenceView } from '@/components/contract-review/RiskAndConsequenceView';
import { SimulationView } from '@/components/contract-review/SimulationView';
import { LegalContractTextView } from '@/components/contract-review/LegalContractTextView';
import { AcknowledgementChecklistView } from '@/components/contract-review/AcknowledgementChecklistView';
import { CooldownTimer } from '@/components/contract-review/CooldownTimer';
import { ContractParametersPanel } from '@/components/contract-review/ContractParametersPanel';
import { NoStateAdvanceWarning } from '@/components/contract-review/NoStateAdvanceWarning';

interface ReviewStep {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  ackFlag: 'summary' | 'timeline' | 'risks' | 'simulation' | 'legalText' | 'checklist' | 'cooldown';
}

const REVIEW_STEPS: ReviewStep[] = [
  {
    id: 1,
    name: 'Summary',
    title: 'Ringkasan Kontrak',
    description: 'Tinjau ringkasan kontrak secara umum',
    icon: '📄',
    ackFlag: 'summary',
  },
  {
    id: 2,
    name: 'Timeline',
    title: 'Garis Waktu Proyek',
    description: 'Pahami jadwal dan tahapan proyek',
    icon: '📅',
    ackFlag: 'timeline',
  },
  {
    id: 3,
    name: 'Risks',
    title: 'Analisis Risiko',
    description: 'Tinjau semua risiko teridentifikasi',
    icon: '⚠️',
    ackFlag: 'risks',
  },
  {
    id: 4,
    name: 'Simulation',
    title: 'Simulasi Skenario',
    description: 'Pertimbangkan skenario hasil yang berbeda',
    icon: '📊',
    ackFlag: 'simulation',
  },
  {
    id: 5,
    name: 'Legal',
    title: 'Teks Legal & Syarat',
    description: 'Baca keseluruhan ketentuan hukum',
    icon: '⚖️',
    ackFlag: 'legalText',
  },
  {
    id: 6,
    name: 'Checklist',
    title: 'Daftar Pengakuan',
    description: 'Konfirmasi semua item yang diperlukan',
    icon: '✓',
    ackFlag: 'checklist',
  },
  {
    id: 7,
    name: 'Cooldown',
    title: 'Periode Pendinginan',
    description: 'Tunggu 48 jam sebelum mengunci dana',
    icon: '⏱️',
    ackFlag: 'cooldown',
  },
];

export default function ContractReviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lockConfirmModal, setLockConfirmModal] = useState(false);
  
  const {
    contractId,
    userId,
    currentStep,
    summary,
    timeline,
    risks,
    scenarios,
    legalText,
    checklist,
    status,
    ackSummary,
    ackTimeline,
    ackRisks,
    ackSimulation,
    ackLegalText,
    ackChecklist,
    ackCooldown,
    acknowledgedChecklistItems,
    cooldownEndTime,
    cooldownRemaining,
    canProceedToLock,
    isLoading,
    isSubmitting,
    error,
    initialize,
    loadContractData,
    setCurrentStep,
    setAck,
    toggleChecklistItem,
    acknowledgeStep,
    approveAndLock,
    setError,
    updateCooldownRemaining,
  } = useContractReviewStore();

  // Initialize on mount
  useEffect(() => {
    if (id && typeof id === 'string') {
      // Get userId from localStorage or auth context
      const storedUserId = localStorage.getItem('userId') || 'user-' + Date.now();
      initialize(id, storedUserId);
      loadContractData(id);
    }
  }, [id, initialize, loadContractData]);

  // Update cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      updateCooldownRemaining();
    }, 1000);
    return () => clearInterval(interval);
  }, [updateCooldownRemaining]);

  if (!id || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat ulasan kontrak...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentStepData = REVIEW_STEPS[currentStep - 1];
  const allAcksFilled = ackSummary && ackTimeline && ackRisks && ackSimulation && ackLegalText && ackChecklist && ackCooldown;
  const allChecklistsChecked = checklist ? acknowledgedChecklistItems.size === checklist.length : false;

  const handleNextStep = async () => {
    if (currentStep === 7) {
      // At cooldown timer, ready to lock
      if (canProceedToLock) {
        setLockConfirmModal(true);
      }
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const handleLockConfirm = async () => {
    const success = await approveAndLock();
    if (success) {
      setLockConfirmModal(false);
      router.push(`/contract/${id}/active-locked`);
    }
  };

  const getStepAckStatus = (step: ReviewStep): boolean => {
    switch (step.ackFlag) {
      case 'summary':
        return ackSummary;
      case 'timeline':
        return ackTimeline;
      case 'risks':
        return ackRisks;
      case 'simulation':
        return ackSimulation;
      case 'legalText':
        return ackLegalText;
      case 'checklist':
        return allChecklistsChecked;
      case 'cooldown':
        return ackCooldown;
      default:
        return false;
    }
  };

  return (
    <Layout>
      <Head>
        <title>Ulasan Kontrak - {id}</title>
      </Head>

      <NoStateAdvanceWarning isVisible={true} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Wizard Steps */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-2">
              <h3 className="font-bold text-gray-900 mb-4">Langkah Review</h3>
              <div className="space-y-2">
                {REVIEW_STEPS.map((step) => {
                  const isCurrentStep = currentStep === step.id;
                  const isPastStep = currentStep > step.id;
                  const isLocked = !REVIEW_STEPS.slice(0, step.id - 1).every((s) => getStepAckStatus(s));
                  const isAcked = getStepAckStatus(step);

                  return (
                    <button
                      key={step.id}
                      onClick={() => isPastStep && setCurrentStep(step.id)}
                      disabled={isLocked && !isPastStep}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        isCurrentStep
                          ? 'bg-blue-600 text-white border-2 border-blue-700 font-semibold'
                          : isPastStep
                          ? 'bg-green-100 text-green-900 border border-green-300 cursor-pointer hover:bg-green-200'
                          : isLocked
                          ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed opacity-50'
                          : 'bg-white text-gray-900 border border-gray-300 hover:border-blue-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{step.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold opacity-75">Langkah {step.id}</p>
                          <p className="font-semibold text-sm">{step.name}</p>
                        </div>
                        {isAcked && !isCurrentStep && <span className="text-lg">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress Summary */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">KEMAJUAN</p>
                <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(currentStep / 7) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-800">
                  Langkah {currentStep} dari 7
                </p>
              </div>
            </div>
          </div>

          {/* Center Column: Step Content */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Step Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
                <p className="text-sm font-semibold opacity-90">Langkah {currentStepData.id} dari 7</p>
                <h1 className="text-3xl font-bold mt-1">{currentStepData.title}</h1>
                <p className="text-blue-100 mt-2">{currentStepData.description}</p>
              </div>

              {/* Step Content */}
              <div>
                {currentStep === 1 && (
                  <SummaryView
                    summary={summary}
                    isLoading={isLoading}
                    onAcknowledge={(val) => setAck('summary', val)}
                    isAcknowledged={ackSummary}
                  />
                )}
                {currentStep === 2 && (
                  <ProcessTimelineView
                    timeline={timeline}
                    isLoading={isLoading}
                    onAcknowledge={(val) => setAck('timeline', val)}
                    isAcknowledged={ackTimeline}
                  />
                )}
                {currentStep === 3 && (
                  <RiskAndConsequenceView
                    risks={risks}
                    isLoading={isLoading}
                    onAcknowledge={(val) => setAck('risks', val)}
                    isAcknowledged={ackRisks}
                  />
                )}
                {currentStep === 4 && (
                  <SimulationView
                    scenarios={scenarios}
                    isLoading={isLoading}
                    onAcknowledge={(val) => setAck('simulation', val)}
                    isAcknowledged={ackSimulation}
                  />
                )}
                {currentStep === 5 && (
                  <LegalContractTextView
                    sections={legalText}
                    isLoading={isLoading}
                    onAcknowledge={(val) => setAck('legalText', val)}
                    isAcknowledged={ackLegalText}
                  />
                )}
                {currentStep === 6 && (
                  <AcknowledgementChecklistView
                    checklist={checklist}
                    isLoading={isLoading}
                    onAcknowledge={toggleChecklistItem}
                    acknowledgedItems={acknowledgedChecklistItems}
                  />
                )}
                {currentStep === 7 && (
                  <CooldownTimer
                    cooldownEndTime={cooldownEndTime}
                    isLoading={isLoading}
                    onCooldownComplete={() => setAck('cooldown', true)}
                  />
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Kembali
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={
                    isSubmitting ||
                    !getStepAckStatus(currentStepData) ||
                    (currentStep === 7 && !canProceedToLock)
                  }
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {currentStep === 7 ? 'Kunci Dana & Aktifkan' : 'Selanjutnya →'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Panels */}
          <div className="lg:col-span-1 space-y-4">
            <ContractParametersPanel
              parameters={
                summary
                  ? {
                      contractor: 'Kontraktor',
                      projectOwner: 'Pemilik Proyek',
                      contractValue: summary.totalValue || 10000000000,
                      currency: 'IDR',
                      startDate: new Date().toISOString().split('T')[0],
                      completionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      numberOfTerms: summary.numberOfTerms || 3,
                      jurisdiction: 'Jakarta',
                      governingLaw: 'Hukum Indonesia',
                    }
                  : null
              }
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Lock Confirmation Modal */}
      {lockConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">⛔ Konfirmasi Akhir</h2>
            <p className="text-gray-700">
              Anda akan mengunci dana dan mengaktifkan kontrak secara permanent. Tindakan ini tidak dapat dibatalkan tanpa intervensi pengadilan.
            </p>
            <ul className="space-y-2 text-sm text-red-800 bg-red-50 p-3 rounded border border-red-200">
              <li>🔒 Dana akan dikunci hingga milestone selesai</li>
              <li>⚖️ Kontrak menjadi mengikat secara hukum</li>
              <li>🚫 Tidak ada pembatalan tanpa pengadilan</li>
            </ul>
            <p className="text-sm font-semibold text-gray-900">Apakah Anda yakin ingin melanjutkan?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLockConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleLockConfirm}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Kunci Dana'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
