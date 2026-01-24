import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import RoleSelector from '@/components/RoleSelector';
import IdentityVerificationStatus from '@/components/IdentityVerificationStatus';
import DeclarationChecklist from '@/components/DeclarationChecklist';
import { useIntentStore } from '@/stores/intentStore';
import { UserRole } from '@/types/intent';

/**
 * Intent Declaration Page
 * State 0: INTENT_DECLARED
 * 
 * This is the first step in the contract lifecycle.
 * Users must declare their intent, role, and confirm legal capacity.
 */
export default function IntentPage() {
  const router = useRouter();
  const store = useIntentStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing intent status on mount
  useEffect(() => {
    const loadIntentStatus = async () => {
      try {
        // In production, this would fetch from /intent/status
        setPageLoading(false);
      } catch (error) {
        console.error('Failed to load intent status:', error);
        setPageLoading(false);
      }
    };

    loadIntentStatus();
  }, []);

  // Redirect if already declared intent
  useEffect(() => {
    if (store.intentStatus?.status === 'INTENT_DECLARED') {
      // User can proceed to next step
      // toast.success('Intent sudah dideklarasikan. Anda dapat melanjutkan ke tahap review.');
      // Uncomment to redirect:
      // router.push('/contract/review');
    }
  }, [store.intentStatus]);

  const handleRoleSelect = (role: UserRole) => {
    store.setSelectedRole(role);
  };

  const handleChecklistChange = (completed: boolean) => {
    store.setChecklistCompleted(completed);
  };

  const handleSubmitIntent = async () => {
    if (!store.isIntentComplete()) {
      toast.error('Silakan lengkapi semua persyaratan terlebih dahulu');
      return;
    }

    setIsSubmitting(true);

    try {
      await store.declareIntent(
        'current-user-id', // In production, get from auth context
        store.selectedRole!,
        store.kycVerified,
        store.acceptedTerms,
        store.confirmedLegalCapacity,
      );

      toast.success('Intent berhasil dideklarasikan! Anda dapat melanjutkan ke tahap review.');
      
      // Redirect to next step after 2 seconds
      setTimeout(() => {
        router.push('/contract/review');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mendeklarasikan intent');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Memuat halaman...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Deklarasi Intent</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Langkah pertama dalam ekosistem AMANTRA: deklarasikan niat, peran, dan kapasitas hukum Anda
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white font-bold">
                  1
                </div>
                <span className="ml-3 text-lg font-medium text-blue-500">
                  Deklarasi Intent (Tahap Sekarang)
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t-4 border-gray-200">
            <div className="pt-4 text-sm text-gray-600 space-y-2">
              <p>✓ Deklarasi intent dan pilih peran</p>
              <p>→ Verifikasi identitas dan legal</p>
              <p>→ Masuk fase review kontrak</p>
              <p>→ Eksekusi kontrak</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Role Selection */}
          <section className="bg-white p-8 rounded-lg shadow-md border-2 border-gray-200">
            <RoleSelector
              selectedRole={store.selectedRole}
              onRoleSelect={handleRoleSelect}
              disabled={isSubmitting}
            />
          </section>

          {/* Identity Verification Status */}
          <section className="bg-white p-8 rounded-lg shadow-md border-2 border-gray-200">
            <IdentityVerificationStatus
              kycVerified={store.kycVerified}
              acceptedTerms={store.acceptedTerms}
              confirmedLegalCapacity={store.confirmedLegalCapacity}
              isLoading={isSubmitting}
            />

            {/* Simulated verification status - in production, these would be backend-verified */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
              <p className="text-sm text-blue-900 mb-3">
                <strong>Catatan:</strong> Dalam implementasi production, status ini akan diverifikasi dari backend setelah proses KYC lengkap.
              </p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={store.kycVerified}
                    onChange={(e) => store.setKycVerified(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>KYC Terverifikasi</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={store.acceptedTerms}
                    onChange={(e) => store.setAcceptedTerms(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>Syarat & Ketentuan Diterima</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={store.confirmedLegalCapacity}
                    onChange={(e) => store.setConfirmedLegalCapacity(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>Kapasitas Hukum Dikonfirmasi</span>
                </label>
              </div>
            </div>
          </section>

          {/* Declaration Checklist */}
          <section className="bg-white p-8 rounded-lg shadow-md border-2 border-gray-200">
            <DeclarationChecklist
              onChecklistChange={handleChecklistChange}
              isLoading={isSubmitting}
            />
          </section>

          {/* Summary & Submit */}
          <section className="bg-white p-8 rounded-lg shadow-md border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Deklarasi</h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Peran yang Dipilih</p>
                  <p className="text-lg font-bold text-gray-900">
                    {store.selectedRole || 'Belum dipilih'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Status Verifikasi</p>
                  <p className="text-lg font-bold text-gray-900">
                    {store.kycVerified && store.acceptedTerms && store.confirmedLegalCapacity
                      ? '✓ Lengkap'
                      : '⏳ Belum Lengkap'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Checklist</p>
                  <p className="text-lg font-bold text-gray-900">
                    {store.checklistCompleted ? '✓ Setuju Semua' : '⏳ Belum Semua'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Siap Deklarasi</p>
                  <p className="text-lg font-bold text-gray-900">
                    {store.isIntentComplete() ? '✓ Ya' : '✗ Tidak'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {store.error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border-2 border-red-300">
                <p className="text-red-900">{store.error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitIntent}
              disabled={!store.isIntentComplete() || isSubmitting}
              className={`w-full px-6 py-3 rounded-lg font-bold text-white transition-all ${
                store.isIntentComplete()
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              } ${isSubmitting ? 'opacity-75' : ''}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Mendeklarasikan Intent...
                </div>
              ) : (
                '✓ Deklarasikan Intent'
              )}
            </button>

            <p className="text-sm text-gray-600 text-center mt-4">
              Dengan mendeklarasikan intent, Anda setuju dengan syarat dan ketentuan AMANTRA
              dan menerima yurisdiksi Republik Indonesia.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
