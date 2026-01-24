import React, { useState, useEffect } from 'react';

interface CooldownTimerProps {
  cooldownEndTime: number | null; // Unix timestamp in milliseconds
  isLoading: boolean;
  onCooldownComplete?: () => void;
}

const formatTimeRemaining = (ms: number): { hours: string; minutes: string; seconds: string } => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
};

export const CooldownTimer: React.FC<CooldownTimerProps> = ({
  cooldownEndTime,
  isLoading,
  onCooldownComplete,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (!cooldownEndTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = cooldownEndTime - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
        if (!hasNotified && onCooldownComplete) {
          onCooldownComplete();
          setHasNotified(true);
        }
      } else {
        setTimeRemaining(remaining);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cooldownEndTime, onCooldownComplete, hasNotified]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!cooldownEndTime) {
    return (
      <div className="text-gray-600">
        Cooldown information not available
      </div>
    );
  }

  const time = timeRemaining !== null ? formatTimeRemaining(timeRemaining) : { hours: '--', minutes: '--', seconds: '--' };
  const progressPercentage = isExpired ? 100 : Math.max(0, 100 - ((timeRemaining || 0) / (48 * 60 * 60 * 1000)) * 100);

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Periode Pendinginan Wajib</h3>
        <p className="text-gray-600">Tunggu periode pendinginan 48 jam sebelum dana dapat dikunci</p>
      </div>

      {/* Main Timer Display */}
      <div className={`rounded-lg p-8 text-center ${isExpired ? 'bg-green-50 border-2 border-green-300' : 'bg-blue-50 border-2 border-blue-300'}`}>
        <p className={`text-sm font-semibold mb-2 ${isExpired ? 'text-green-700' : 'text-blue-700'}`}>
          {isExpired ? '✓ Periode Pendinginan Selesai' : '⏳ Waktu Tersisa'}
        </p>
        
        {!isExpired && (
          <div className="font-mono text-5xl font-bold text-blue-600 mb-2 tracking-wider">
            {time.hours}:{time.minutes}:{time.seconds}
          </div>
        )}
        
        {isExpired && (
          <div className="text-4xl font-bold text-green-600 mb-2">
            ✓ Siap Lanjut
          </div>
        )}

        <p className={`text-sm ${isExpired ? 'text-green-600' : 'text-blue-600'}`}>
          {isExpired 
            ? 'Anda sekarang dapat melanjutkan untuk mengunci dana'
            : 'Harap tunggu untuk melanjutkan'}
        </p>
      </div>

      {/* Time Unit Display */}
      {!isExpired && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-100 rounded-lg p-3 text-center border border-blue-300">
            <p className="text-2xl font-bold text-blue-600">{time.hours}</p>
            <p className="text-xs text-blue-700 font-semibold mt-1">Jam</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-3 text-center border border-blue-300">
            <p className="text-2xl font-bold text-blue-600">{time.minutes}</p>
            <p className="text-xs text-blue-700 font-semibold mt-1">Menit</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-3 text-center border border-blue-300">
            <p className="text-2xl font-bold text-blue-600">{time.seconds}</p>
            <p className="text-xs text-blue-700 font-semibold mt-1">Detik</p>
          </div>
        </div>
      )}

      {/* Progress Ring */}
      <div className="flex justify-center">
        <div className="relative w-40 h-40">
          {/* Background Circle */}
          <svg className="absolute inset-0" width="160" height="160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            {/* Progress Circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={isExpired ? '#10b981' : '#3b82f6'}
              strokeWidth="4"
              strokeDasharray={`${(progressPercentage / 100) * 440} 440`}
              strokeLinecap="round"
              className="transition-all duration-1000"
              transform="rotate(-90 80 80)"
            />
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-gray-600">Progres</p>
            <p className={`text-2xl font-bold ${isExpired ? 'text-green-600' : 'text-blue-600'}`}>
              {Math.round(progressPercentage)}%
            </p>
          </div>
        </div>
      </div>

      {/* What is Cooling-off Period */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-purple-900 mb-2">❓ Apa Itu Periode Pendinginan?</p>
        <p className="text-sm text-purple-800 leading-relaxed">
          Periode pendinginan 48 jam adalah periode hukum yang memberikan Anda waktu untuk:
        </p>
        <ul className="space-y-1 text-sm text-purple-800 mt-2">
          <li>• Mempertimbangkan kembali komitmen finansial Anda</li>
          <li>• Berkonsultasi dengan penasihat hukum atau keuangan</li>
          <li>• Batalkan kontrak tanpa penalti jika Anda berubah pikiran</li>
          <li>• Memastikan semua pihak siap untuk melanjutkan</li>
        </ul>
      </div>

      {/* Status Information */}
      <div className={`rounded-lg p-4 ${isExpired ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-start gap-2">
          <span className="text-lg">{isExpired ? '✓' : '⏳'}</span>
          <div>
            <p className={`font-semibold ${isExpired ? 'text-green-900' : 'text-yellow-900'}`}>
              {isExpired ? 'Siap Melanjutkan' : 'Menunggu Pendinginan'}
            </p>
            <p className={`text-sm mt-1 ${isExpired ? 'text-green-700' : 'text-yellow-700'}`}>
              {isExpired 
                ? 'Periode pendinginan telah selesai. Anda sekarang dapat melanjutkan untuk mengunci dana dan mengaktifkan kontrak.'
                : 'Periode pendinginan 48 jam dimulai saat Anda mengakui semua item. Selama waktu ini, Anda dapat membatalkan tanpa penalti.'}
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm font-bold text-blue-900 mb-1">📝 HAK PEMBATALAN</p>
        <p className="text-sm text-blue-800 leading-relaxed">
          Selama periode pendinginan 48 jam, Anda dapat membatalkan kontrak ini tanpa biaya, penalti, atau alasan apa pun dengan menghubungi tim dukungan kami. Hak ini dilindungi oleh hukum Indonesia dan tidak dapat dibatalkan.
        </p>
      </div>

      {/* Next Step Button Status */}
      <div className={`rounded-lg p-4 border-2 text-center ${
        isExpired 
          ? 'bg-green-100 border-green-400' 
          : 'bg-gray-100 border-gray-300'
      }`}>
        <p className={`text-sm font-semibold ${isExpired ? 'text-green-900' : 'text-gray-600'}`}>
          {isExpired 
            ? '✓ Tombol "Kunci Dana" Diaktifkan' 
            : '⛔ Tombol "Kunci Dana" Dinonaktifkan'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {isExpired
            ? 'Anda dapat sekarang melanjutkan dengan mengklik tombol "Kunci Dana & Aktifkan Kontrak"'
            : 'Tombol akan aktif setelah periode pendinginan selesai'}
        </p>
      </div>

      {/* Last Chance Warning */}
      {isExpired && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm font-bold text-red-900 mb-1">⚠️ KESEMPATAN TERAKHIR</p>
          <p className="text-sm text-red-800 leading-relaxed">
            Setelah Anda mengklik "Kunci Dana & Aktifkan Kontrak", kontrak menjadi aktif dan binding. Tidak ada pembatalan lagi setelah titik ini tanpa intervensi pengadilan formal.
          </p>
        </div>
      )}
    </div>
  );
};
