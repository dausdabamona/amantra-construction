import React from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi';
import { ContractStateData, ContractState } from '../../types/contract-lock';

interface Props {
  data: ContractStateData | null;
  isLoading?: boolean;
}

const stateColors: Record<ContractState, { bg: string; text: string; icon: string }> = {
  INTENT_DECLARED: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600' },
  PRE_CONTRACT_REVIEW: { bg: 'bg-yellow-50', text: 'text-yellow-900', icon: 'text-yellow-600' },
  CONTRACT_ACTIVE_LOCKED: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600' },
  OPERATION_RUNNING: { bg: 'bg-purple-50', text: 'text-purple-900', icon: 'text-purple-600' },
  PROGRESS_VERIFICATION: { bg: 'bg-indigo-50', text: 'text-indigo-900', icon: 'text-indigo-600' },
  PAYMENT_RELEASE: { bg: 'bg-emerald-50', text: 'text-emerald-900', icon: 'text-emerald-600' },
  CONTRACT_COMPLETED: { bg: 'bg-gray-50', text: 'text-gray-900', icon: 'text-gray-600' },
};

const stateLabels: Record<ContractState, string> = {
  INTENT_DECLARED: 'Deklarasi Niat',
  PRE_CONTRACT_REVIEW: 'Pemeriksaan Pra-Kontrak',
  CONTRACT_ACTIVE_LOCKED: 'Kontrak Aktif & Terkunci',
  OPERATION_RUNNING: 'Operasi Berjalan',
  PROGRESS_VERIFICATION: 'Verifikasi Kemajuan',
  PAYMENT_RELEASE: 'Pelepasan Pembayaran',
  CONTRACT_COMPLETED: 'Kontrak Selesai',
};

const stateDescriptions: Record<ContractState, string> = {
  INTENT_DECLARED: 'Pihak telah mendeklarasikan niat untuk melanjutkan dengan kontrak',
  PRE_CONTRACT_REVIEW: 'Kontrak sedang dalam fase pemeriksaan dan persetujuan pra-kontrak',
  CONTRACT_ACTIVE_LOCKED:
    'Kontrak sekarang aktif dan binding. Dana telah dikunci dalam escrow dan tidak dapat ditarik kembali.',
  OPERATION_RUNNING: 'Operasi konstruksi sedang berlangsung sesuai dengan jadwal yang disepakati',
  PROGRESS_VERIFICATION: 'Kemajuan pekerjaan sedang diverifikasi oleh pengawas dan saksi',
  PAYMENT_RELEASE: 'Pembayaran sedang diproses berdasarkan milestone yang diselesaikan',
  CONTRACT_COMPLETED: 'Kontrak telah selesai dan semua pembayaran telah diproses',
};

export const ContractStatePanel: React.FC<Props> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <HiOutlineQuestionMarkCircle className="text-2xl" />
          <p className="font-medium">Memuat status kontrak...</p>
        </div>
      </div>
    );
  }

  const colors = stateColors[data.state];
  const isLocked = data.isFundsLocked;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Kontrak Saat Ini</h3>

      {/* Current State */}
      <div className={`${colors.bg} rounded-lg p-4 mb-6 border-l-4 border-current`} style={{ borderColor: colors.icon }}>
        <div className="flex items-start gap-3">
          <HiOutlineCheckCircle className={`text-2xl ${colors.icon} flex-shrink-0 mt-1`} />
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Status Saat Ini</p>
            <p className={`text-2xl font-bold ${colors.text}`}>{stateLabels[data.state]}</p>
            <p className="text-sm text-gray-600 mt-2">{stateDescriptions[data.state]}</p>
          </div>
        </div>
      </div>

      {/* State Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Substatus */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Sub-Status</p>
          <p className="text-base font-semibold text-gray-900">{data.substatus}</p>
        </div>

        {/* Current Milestone */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Milestone Saat Ini</p>
          <p className="text-base font-semibold text-gray-900">Milestone {data.currentMilestone}</p>
        </div>

        {/* Funds Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Status Dana</p>
          <div className="flex items-center gap-2">
            {isLocked ? (
              <>
                <HiOutlineCheckCircle className="text-green-600 text-lg" />
                <p className="text-base font-semibold text-green-700">Terkunci dalam Escrow</p>
              </>
            ) : (
              <>
                <HiOutlineXCircle className="text-yellow-600 text-lg" />
                <p className="text-base font-semibold text-yellow-700">Belum Terkunci</p>
              </>
            )}
          </div>
        </div>

        {/* Next Responsible Party */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Pihak Bertanggung Jawab Berikutnya</p>
          <p className="text-base font-semibold text-gray-900">{data.nextResponsibleParty}</p>
        </div>
      </div>

      {/* Important Information */}
      {data.isFundsLocked && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <div className="flex gap-3">
            <HiOutlineCheckCircle className="text-green-600 text-xl flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 mb-1">Kontrak Sekarang Aktif & Binding</p>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Dana telah diamankan dalam escrow</li>
                <li>✓ Komitmen hukum telah dibentuk</li>
                <li>✓ Tidak ada pihak yang dapat membatalkan sekarang</li>
                <li>✓ Operasi dapat dimulai sesuai jadwal</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Timeline - Simple representation */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-sm font-semibold text-gray-900 mb-4">Fase Kontrak</p>
        <div className="space-y-3">
          {[
            { label: 'Deklarasi Niat', completed: true },
            { label: 'Pemeriksaan Pra-Kontrak', completed: true },
            { label: 'Kontrak Aktif & Terkunci', completed: data.state === 'CONTRACT_ACTIVE_LOCKED' },
            { label: 'Operasi Berjalan', completed: false },
            { label: 'Verifikasi & Pembayaran', completed: false },
            { label: 'Selesai', completed: false },
          ].map((phase, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  phase.completed ? 'bg-green-600' : 'bg-gray-300'
                }`}
              ></div>
              <span className={phase.completed ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                {phase.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      {data.isFundsLocked && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs font-semibold text-orange-900 uppercase mb-2">Perhatian Penting</p>
          <p className="text-sm text-orange-800">
            Penguncian dana adalah tindakan yang tidak dapat dibalikkan. Ini menandakan komitmen penuh terhadap
            kontrak oleh semua pihak. Setiap perubahan yang signifikan pada kontrak setelah penguncian ini memerlukan
            persetujuan tertulis dari semua pihak.
          </p>
        </div>
      )}
    </div>
  );
};
