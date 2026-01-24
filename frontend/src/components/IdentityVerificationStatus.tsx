import React from 'react';

interface IdentityVerificationStatusProps {
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  isLoading?: boolean;
}

interface VerificationItem {
  id: string;
  label: string;
  description: string;
  status: 'verified' | 'pending' | 'failed';
  icon: string;
}

export const IdentityVerificationStatus: React.FC<IdentityVerificationStatusProps> = ({
  kycVerified,
  acceptedTerms,
  confirmedLegalCapacity,
  isLoading = false,
}) => {
  const verificationItems: VerificationItem[] = [
    {
      id: 'kyc',
      label: 'Verifikasi KYC',
      description: 'Verifikasi identitas dan latar belakang',
      status: kycVerified ? 'verified' : 'pending',
      icon: '🆔',
    },
    {
      id: 'terms',
      label: 'Penerimaan Syarat & Ketentuan',
      description: 'Penerimaan syarat dan ketentuan platform',
      status: acceptedTerms ? 'verified' : 'pending',
      icon: '📋',
    },
    {
      id: 'legal',
      label: 'Konfirmasi Kapasitas Hukum',
      description: 'Konfirmasi kapasitas hukum untuk membuat kontrak',
      status: confirmedLegalCapacity ? 'verified' : 'pending',
      icon: '⚖️',
    },
  ];

  const allVerified = kycVerified && acceptedTerms && confirmedLegalCapacity;
  const verifiedCount = [kycVerified, acceptedTerms, confirmedLegalCapacity].filter(Boolean).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
            <span>✓</span> Terverifikasi
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
            <span>⏳</span> Menunggu
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
            <span>✗</span> Gagal
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Status Verifikasi Identitas</h3>
        <div className="text-sm text-gray-600">
          {verifiedCount}/{verificationItems.length} terpenuhi
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            allVerified ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${(verifiedCount / verificationItems.length) * 100}%` }}
        />
      </div>

      {/* Verification Items */}
      <div className="space-y-3">
        {verificationItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              item.status === 'verified'
                ? 'border-green-200 bg-green-50'
                : 'border-yellow-200 bg-yellow-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">{item.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              {!isLoading && getStatusBadge(item.status)}
              {isLoading && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full animate-pulse">
                  ⏳ Memproses...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overall Status */}
      <div className={`p-4 rounded-lg border-2 ${
        allVerified
          ? 'border-green-300 bg-green-50'
          : 'border-blue-300 bg-blue-50'
      }`}>
        {allVerified ? (
          <p className="text-green-900 font-semibold">
            ✓ Semua verifikasi selesai! Anda siap melanjutkan ke tahap berikutnya.
          </p>
        ) : (
          <p className="text-blue-900">
            ⏳ Lengkapi semua verifikasi di atas untuk melanjutkan ({verifiedCount}/{verificationItems.length})
          </p>
        )}
      </div>
    </div>
  );
};

export default IdentityVerificationStatus;
