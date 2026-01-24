import React from 'react';
import {
  HiOutlineLockClosed,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineLink,
} from 'react-icons/hi';
import { LockedStatusCardData } from '../../types/contract-lock';

interface Props {
  data: LockedStatusCardData | null;
  isLoading?: boolean;
}

export const LockedStatusCard: React.FC<Props> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
        <div className="flex items-center gap-3">
          <HiOutlineLockClosed className="text-yellow-600 text-2xl" />
          <div>
            <h3 className="font-semibold text-yellow-900">Kontrak Belum Dikunci</h3>
            <p className="text-sm text-yellow-700">
              Dana belum dikunci dalam escrow. Selesaikan langkah persetujuan pra-kontrak terlebih dahulu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(data.lockedAmount);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data.lockTimestamp));

  const holdingStatusColor = {
    ESCROW_HELD: 'text-red-600 bg-red-50',
    PARTIAL_RELEASED: 'text-yellow-600 bg-yellow-50',
    FULLY_RELEASED: 'text-green-600 bg-green-50',
  };

  const holdingStatusLabel = {
    ESCROW_HELD: 'Ditahan dalam Escrow',
    PARTIAL_RELEASED: 'Sebagian Dirilis',
    FULLY_RELEASED: 'Sepenuhnya Dirilis',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
        <div className="p-3 bg-green-100 rounded-lg">
          <HiOutlineLockClosed className="text-green-600 text-2xl" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dana Terkunci</h3>
          <p className="text-sm text-gray-600">Kontrak sekarang aktif dan binding</p>
        </div>
      </div>

      {/* Locked Amount */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-1">Jumlah Dana Terkunci</p>
        <p className="text-3xl font-bold text-gray-900">{formattedAmount}</p>
        <p className="text-xs text-gray-500 mt-1">Dalam escrow, tidak dapat ditarik kembali sebelum fase berikutnya</p>
      </div>

      {/* Lock Timestamp */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          <HiOutlineClock className="text-gray-600 text-xl mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Waktu Penguncian</p>
            <p className="text-gray-900 font-semibold">{formattedDate}</p>
            <p className="text-xs text-gray-600 mt-1">
              Penguncian ini menciptakan komitmen hukum antara semua pihak
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Hash */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Hash Transaksi (Blockchain Proof)</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 p-3 rounded font-mono text-gray-700 break-all">
            {data.transactionHash}
          </code>
          {data.explorerLink && (
            <a
              href={data.explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Lihat di Blockchain Explorer"
            >
              <HiOutlineLink className="text-xl" />
            </a>
          )}
        </div>
      </div>

      {/* Holding Status */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Status Penahan Dana</p>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
            holdingStatusColor[data.holdingStatus]
          }`}
        >
          <HiOutlineCheckCircle className="text-xl" />
          {holdingStatusLabel[data.holdingStatus]}
        </div>
      </div>

      {/* Percentage Held */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Persentase Ditahan</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-600 h-full transition-all duration-300"
              style={{ width: `${data.percentageHeld}%` }}
            ></div>
          </div>
          <span className="text-lg font-bold text-gray-900">{data.percentageHeld}%</span>
        </div>
      </div>

      {/* Important Note */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-200">
              <span className="text-blue-900 font-bold text-xs">!</span>
            </div>
          </div>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Transaksi Ini Tidak Dapat Dibalikkan</p>
            <p>
              Setelah dana dikunci, tidak ada pihak yang dapat menarik dana sebelum kontrak berlanjut ke fase
              berikutnya. Penguncian ini menciptakan kepercayaan dan keamanan bagi semua pihak yang terlibat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
