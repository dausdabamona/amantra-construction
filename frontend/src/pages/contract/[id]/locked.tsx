import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { HiOutlineExclamation, HiOutlineCheckCircle } from 'react-icons/hi';
import { LockedStatusCard } from '../../../components/contract-lock/LockedStatusCard';
import { ContractStatePanel } from '../../../components/contract-lock/ContractStatePanel';
import { RightsObligationsPanel } from '../../../components/contract-lock/RightsObligationsPanel';
import { NextConditionPanel } from '../../../components/contract-lock/NextConditionPanel';
import { useContractLockStore } from '../../../hooks/useContractLockStore';
import Layout from '../../../components/Layout';

export default function ContractLockedPage() {
  const router = useRouter();
  const { id } = router.query;
  const [mounted, setMounted] = useState(false);

  // Store
  const {
    contractState,
    lockedStatus,
    rightsObligations,
    nextCondition,
    panelState,
    isLoading,
    isFetching,
    error,
    successMessage,
    setContractId,
    setContractState,
    setLockedStatus,
    setRightsObligations,
    setNextCondition,
    setIsLoading,
    setIsFetching,
    setError,
    setSuccessMessage,
    setSelectedParty,
    setActiveTab,
  } = useContractLockStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data
  useEffect(() => {
    if (!id || !mounted) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setContractId(id as string);

      try {
        // Mock API calls - replace with actual API calls
        const token = localStorage.getItem('token');

        // Get contract state
        const stateRes = await fetch(`/api/contract/${id}/lock/state`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);

        if (stateRes?.ok) {
          const stateData = await stateRes.json();
          setContractState(stateData.data);
        } else {
          // Mock data
          setContractState({
            state: 'CONTRACT_ACTIVE_LOCKED',
            lockedAmount: 10000000000,
            lockTimestamp: new Date(),
            lockingTxHash: '0x1234567890abcdef',
            currentMilestone: 1,
            substatus: 'AWAITING_OPERATION_START',
            isFundsLocked: true,
            operationStartDate: '2026-02-01',
            nextResponsibleParty: 'Contractor',
            rightsObligations: {
              contractor: [
                'Hak: Akses ke lokasi konstruksi selama masa kontrak',
                'Kewajiban: Menyediakan pekerja terampil dan berpengalaman',
              ],
              projectOwner: [
                'Hak: Memantau kemajuan pekerjaan secara berkala',
                'Kewajiban: Melakukan pembayaran tepat waktu',
              ],
            },
          });
        }

        // Get locked status
        const statusRes = await fetch(`/api/contract/${id}/lock/locked-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);

        if (statusRes?.ok) {
          const statusData = await statusRes.json();
          setLockedStatus(statusData.data);
        } else {
          // Mock data
          setLockedStatus({
            lockedAmount: 10000000000,
            lockTimestamp: new Date(),
            transactionHash: '0x1234567890abcdef1234567890abcdef',
            explorerLink: 'https://etherscan.io/tx/0x1234567890abcdef',
            holdingStatus: 'ESCROW_HELD',
            percentageHeld: 100,
          });
        }

        // Get rights and obligations
        const roRes = await fetch(`/api/contract/${id}/lock/rights-obligations`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);

        if (roRes?.ok) {
          const roData = await roRes.json();
          setRightsObligations(roData.data);
        } else {
          // Mock data
          setRightsObligations([
            {
              itemId: 'RO-001',
              type: 'right',
              party: 'Contractor',
              description: 'Akses ke lokasi konstruksi',
              details: 'Hak untuk mengakses lokasi tanpa hambatan',
              importance: 'critical',
              contractReference: 'Section 3.1',
            },
            {
              itemId: 'RO-002',
              type: 'obligation',
              party: 'Contractor',
              description: 'Pekerja terampil',
              details: 'Wajib menyediakan pekerja berkualifikasi',
              importance: 'critical',
              contractReference: 'Section 3.2',
            },
          ]);
        }

        // Get next condition
        const ncRes = await fetch(`/api/contract/${id}/lock/next-condition`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);

        if (ncRes?.ok) {
          const ncData = await ncRes.json();
          setNextCondition(ncData.data);
        } else {
          // Mock data
          setNextCondition({
            actionRequired: 'OPERATION_START_CONFIRMATION',
            responsibleParty: 'Contractor',
            description: 'Kontraktor harus mengkonfirmasi siap memulai pekerjaan',
            deadline: '2026-02-01',
            daysRemaining: 7,
            consequence: 'Jika tidak memulai, pemilik dapat membatalkan kontrak',
            isOverdue: false,
            isBlocking: false,
          });
        }

        setSuccessMessage('Data kontrak berhasil dimuat');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setError('Gagal memuat data kontrak');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <HiOutlineCheckCircle className="text-green-600 text-2xl" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Kontrak Aktif & Terkunci</h1>
                <p className="text-gray-600 mt-1">
                  Kontrak #{id} sekarang aktif dan binding. Dana telah diamankan dalam escrow.
                </p>
              </div>
            </div>

            {/* Status Banner */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium text-green-900">Dana Terkunci: IDR 10 Miliar</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Status: CONTRACT_ACTIVE_LOCKED</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-sm font-medium text-purple-900">Milestone: 1 dari 3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3 text-red-900">
              <HiOutlineExclamation className="text-xl flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-b border-green-200 px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3 text-green-900">
              <HiOutlineCheckCircle className="text-xl flex-shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Important Warning Banner */}
        <div className="bg-orange-50 border-b border-orange-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-20 z-20">
          <div className="flex items-start gap-3">
            <HiOutlineExclamation className="text-orange-600 text-xl mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">Transaksi Tidak Dapat Dibalikkan</p>
              <p className="text-sm text-orange-800 mt-1">
                Penguncian dana ini adalah keputusan tidak dapat dibalikkan. Semua pihak telah berkomitmen untuk
                melanjutkan kontrak. Setiap perubahan yang signifikan memerlukan persetujuan tertulis dari semua pihak.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Locked Status Card */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Dana</h2>
                <LockedStatusCard data={lockedStatus} isLoading={isLoading} />
              </section>

              {/* Contract State */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Kontrak</h2>
                <ContractStatePanel data={contractState} isLoading={isLoading} />
              </section>

              {/* Rights and Obligations */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Hak & Kewajiban</h2>
                <RightsObligationsPanel
                  items={rightsObligations}
                  isLoading={isLoading}
                  selectedParty={panelState.selectedParty as any}
                  onPartyChange={setSelectedParty}
                />
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Next Condition */}
              <div className="sticky top-40">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Aksi Berikutnya</h2>
                <NextConditionPanel data={nextCondition} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-8 mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-gray-600 text-sm">Tanggal Penguncian</p>
                <p className="text-lg font-semibold text-gray-900">
                  {lockedStatus?.lockTimestamp
                    ? new Intl.DateTimeFormat('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(new Date(lockedStatus.lockTimestamp))
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Status Operasi</p>
                <p className="text-lg font-semibold text-gray-900">Menunggu Dimulai</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Milestone Aktif</p>
                <p className="text-lg font-semibold text-gray-900">{contractState?.currentMilestone || 1} dari 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
