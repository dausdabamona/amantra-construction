import React, { useEffect, useState } from 'react';
import {
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { NextConditionData } from '../../types/contract-lock';

interface Props {
  data: NextConditionData | null;
  isLoading?: boolean;
}

export const NextConditionPanel: React.FC<Props> = ({ data, isLoading = false }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!data?.deadline) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(data.deadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        setTimeRemaining({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.deadline]);

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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Tidak ada kondisi berikutnya yang tersedia</p>
      </div>
    );
  }

  const isBlocking = data.isBlocking;
  const isOverdue = data.isOverdue;

  const alertColor = isBlocking ? 'red' : isOverdue ? 'orange' : 'blue';
  const alertBgColor = {
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
    blue: 'bg-blue-50 border-blue-200',
  }[alertColor];

  const alertTextColor = {
    red: 'text-red-900',
    orange: 'text-orange-900',
    blue: 'text-blue-900',
  }[alertColor];

  const alertIconColor = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
  }[alertColor];

  const formattedDeadline = new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data.deadline));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Kondisi Berikutnya yang Diperlukan</h3>

      {/* Main Alert */}
      <div className={`border rounded-lg p-4 mb-6 ${alertBgColor}`}>
        <div className="flex gap-3">
          {isBlocking ? (
            <HiOutlineExclamation className={`text-2xl ${alertIconColor} flex-shrink-0 mt-0.5`} />
          ) : isOverdue ? (
            <HiOutlineClock className={`text-2xl ${alertIconColor} flex-shrink-0 mt-0.5`} />
          ) : (
            <HiOutlineCheckCircle className={`text-2xl ${alertIconColor} flex-shrink-0 mt-0.5`} />
          )}
          <div>
            <p className={`font-semibold ${alertTextColor} mb-1`}>
              {isBlocking ? 'Aksi Penting Diperlukan' : isOverdue ? 'Melewati Batas Waktu' : 'Aksi Berikutnya'}
            </p>
            <p className={alertTextColor}>{data.description}</p>
          </div>
        </div>
      </div>

      {/* Action Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Action Required */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 uppercase mb-2">Aksi Diperlukan</p>
          <p className="text-base font-semibold text-gray-900">{data.actionRequired}</p>
        </div>

        {/* Responsible Party */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 uppercase mb-2">Pihak Bertanggung Jawab</p>
          <p className="text-base font-semibold text-gray-900">{data.responsibleParty}</p>
        </div>
      </div>

      {/* Deadline */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <HiOutlineClock className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Batas Waktu</p>
            <p className="text-blue-900 font-semibold">{formattedDeadline}</p>
            <p className="text-xs text-blue-800 mt-1">
              Hari yang tersisa: <span className="font-bold">{data.daysRemaining}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      {timeRemaining && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Waktu Tersisa</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{timeRemaining.days}</p>
              <p className="text-xs text-gray-600">Hari</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{String(timeRemaining.hours).padStart(2, '0')}</p>
              <p className="text-xs text-gray-600">Jam</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-600">Menit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-600">Detik</p>
            </div>
          </div>
        </div>
      )}

      {/* Consequence */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex gap-3">
          <HiOutlineExclamation className="text-yellow-600 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-900 mb-1">Konsekuensi Jika Tidak Ditindaklanjuti</p>
            <p className="text-sm text-yellow-800">{data.consequence}</p>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        {isBlocking && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            Aksi Penting
          </span>
        )}
        {isOverdue && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
            Melewati Batas Waktu
          </span>
        )}
        {!isBlocking && !isOverdue && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            Dalam Jadwal
          </span>
        )}
      </div>

      {/* Action Button Placeholder */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <HiOutlineArrowRight className="text-gray-600 text-lg" />
            <p className="text-sm font-medium text-gray-700">
              Siap untuk melakukan aksi berikutnya?
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Tindaklanjuti
          </button>
        </div>
      </div>
    </div>
  );
};
