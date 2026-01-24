import React, { useMemo } from 'react';
import { AcknowledgementChecklistItem } from '@/types/contract-review';

interface AcknowledgementChecklistViewProps {
  checklist: AcknowledgementChecklistItem[] | null;
  isLoading: boolean;
  onAcknowledge: (itemId: string, acknowledged: boolean) => void;
  acknowledgedItems: Set<string>;
}

const getItemIcon = (itemId: string) => {
  switch (itemId) {
    case 'read_summary':
      return '📄';
    case 'reviewed_timeline':
      return '📅';
    case 'understand_risks':
      return '⚠️';
    case 'reviewed_scenarios':
      return '📊';
    case 'read_legal_text':
      return '⚖️';
    case 'confirmed_checklist':
      return '✓';
    case 'understand_cooling_off':
      return '⏱️';
    default:
      return '•';
  }
};

export const AcknowledgementChecklistView: React.FC<AcknowledgementChecklistViewProps> = ({
  checklist,
  isLoading,
  onAcknowledge,
  acknowledgedItems,
}) => {
  const completionPercentage = useMemo(() => {
    if (!checklist || checklist.length === 0) return 0;
    return Math.round((acknowledgedItems.size / checklist.length) * 100);
  }, [checklist, acknowledgedItems]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-200 rounded w-full"></div>
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!checklist || checklist.length === 0) {
    return <div className="text-red-600">Daftar pengakuan tidak tersedia</div>;
  }

  const allAcknowledged = acknowledgedItems.size === checklist.length;

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Daftar Pengakuan Kontrak</h3>
        <p className="text-gray-600">Konfirmasi bahwa Anda telah meninjau dan memahami SEMUA item di bawah ini</p>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Kemajuan Pengakuan</p>
          <p className="text-sm font-bold text-blue-600">{acknowledgedItems.size}/{checklist.length}</p>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">{completionPercentage}% selesai</p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.map((item) => {
          const isChecked = acknowledgedItems.has(item.itemId);

          return (
            <div
              key={item.itemId}
              className={`p-4 rounded-lg border-2 transition ${
                isChecked
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-300 hover:border-blue-300'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onAcknowledge(item.itemId, e.target.checked)}
                  className={`mt-1 w-5 h-5 rounded focus:ring-2 ${
                    isChecked ? 'bg-green-600 border-green-600' : 'border-gray-400'
                  } focus:ring-blue-500`}
                  disabled={false}
                />
                <div className="flex-1">
                  <p className={`font-semibold ${isChecked ? 'text-green-900' : 'text-gray-900'}`}>
                    {getItemIcon(item.itemId)} {item.text}
                  </p>
                  <p className={`text-sm mt-1 ${isChecked ? 'text-green-700' : 'text-gray-600'}`}>
                    {item.description}
                  </p>
                  {item.isCritical && (
                    <p className="text-xs font-bold text-red-600 mt-1">⚠️ WAJIB DITERIMA</p>
                  )}
                </div>
                {isChecked && <span className="text-2xl text-green-600">✓</span>}
              </label>
            </div>
          );
        })}
      </div>

      {/* Status Box */}
      {allAcknowledged ? (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <p className="text-lg font-bold text-green-900">✓ Semua Item Dikonfirmasi</p>
          <p className="text-sm text-green-700 mt-1">
            Anda telah meninjau dan mengakui semua 7 item yang diperlukan. Silakan lanjutkan ke langkah berikutnya untuk memulai periode pendinginan 48 jam.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <p className="text-lg font-bold text-yellow-900">⏳ {checklist.length - acknowledgedItems.size} Item Tertunda</p>
          <p className="text-sm text-yellow-700 mt-1">
            Anda harus mengakui SEMUA item di atas sebelum dapat melanjutkan. Jangan ada pengecualian.
          </p>
        </div>
      )}

      {/* Critical Notice */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-sm font-bold text-red-900 mb-2">🔴 PERHATIAN PENTING</p>
        <ul className="space-y-1 text-sm text-red-800">
          <li>• SEMUA 7 item HARUS diakui - tidak ada pilihan untuk menolak item individual</li>
          <li>• Dengan mengakui, Anda setuju dengan SEMUA syarat dan ketentuan kontrak</li>
          <li>• Pengakuan ini adalah mengikat dan dapat diaudit oleh regulator</li>
          <li>• Anda tidak dapat melanjutkan tanpa menyelesaikan daftar ini sepenuhnya</li>
        </ul>
      </div>

      {/* Summary of Critical Items */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">📋 Ringkasan Poin Kritis:</p>
        <div className="space-y-1 text-sm text-blue-800">
          <p>✓ Anda telah membaca ringkasan kontrak lengkap</p>
          <p>✓ Anda memahami semua tahap timeline proyek</p>
          <p>✓ Anda mengakui semua risiko teridentifikasi dan dampak potensialnya</p>
          <p>✓ Anda telah meninjau semua skenario simulasi hasil yang mungkin</p>
          <p>✓ Anda telah membaca seluruh teks legal dan pasal kontrak</p>
          <p>✓ Anda setuju dengan daftar pengakuan lengkap ini</p>
          <p>✓ Anda memahami periode pendinginan 48 jam dan hak pembatalan</p>
        </div>
      </div>

      {/* Cannot Proceed Warning */}
      {!allAcknowledged && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
          <p className="text-sm font-bold text-orange-900 mb-1">⛔ Tidak Dapat Melanjutkan</p>
          <p className="text-sm text-orange-800">
            Tombol "Selanjutnya" akan tetap dinonaktifkan sampai Anda mengakui semua item di atas. Ini adalah untuk perlindungan Anda.
          </p>
        </div>
      )}

      {/* Completion Timestamp Indicator */}
      {allAcknowledged && (
        <div className="bg-green-100 text-green-900 p-3 rounded-lg text-sm text-center">
          <p className="font-semibold">✓ Daftar Pengakuan Selesai</p>
          <p className="text-xs mt-1">Anda sekarang siap untuk melanjutkan ke tahap berikutnya</p>
        </div>
      )}
    </div>
  );
};
