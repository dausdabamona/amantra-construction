import React, { useState, useEffect } from 'react';

interface NoStateAdvanceWarningProps {
  isVisible?: boolean;
}

export const NoStateAdvanceWarning: React.FC<NoStateAdvanceWarningProps> = ({
  isVisible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-collapse after 10 seconds if user hasn't interacted
  useEffect(() => {
    const timer = setTimeout(() => {
      // Keep expanded by default during review
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 mb-4">
      {/* Expanded Warning Banner */}
      {isExpanded && (
        <div className="bg-red-50 border-b-4 border-red-600 px-4 py-3 shadow-md">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⛔</span>
                <p className="font-bold text-red-900 text-sm">PERINGATAN PENTING: TIDAK ADA KEMUNDURAN SETELAH PENGUNCIAN</p>
              </div>
              <p className="text-red-800 text-sm mt-2 leading-relaxed ml-8">
                Setelah Anda melampaui periode pendinginan 48 jam dan mengklik <strong>"Kunci Dana & Aktifkan Kontrak"</strong>, 
                uang akan terkunci dan kontrak menjadi mengikat secara hukum. <strong>TIDAK ADA PEMBATALAN</strong> tanpa intervensi pengadilan formal. 
                Ini adalah keputusan permanen dan irreversibel.
              </p>
              <ul className="text-red-800 text-sm mt-2 ml-8 space-y-1">
                <li>🔒 Dana dikunci dan tidak dapat diakses sampai milestone diselesaikan</li>
                <li>⚖️ Kontrak mengikat secara hukum - hanya pengadilan yang dapat membatalkan</li>
                <li>🚫 Tidak ada "undo" atau pembatalan tanpa alasan setelah aktivasi</li>
                <li>✓ Anda harus menyelesaikan prosedur review penuh terlebih dahulu</li>
              </ul>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-red-600 hover:text-red-800 text-xl font-bold flex-shrink-0"
              aria-label="Close warning"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Warning Indicator */}
      {!isExpanded && (
        <div className="bg-red-100 border-b-2 border-red-600 px-4 py-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 text-red-800 hover:text-red-900 font-semibold text-sm w-full"
          >
            <span>⛔</span>
            <span>Klik untuk menampilkan peringatan penting tentang penguncian dana</span>
            <span className="ml-auto">▼</span>
          </button>
        </div>
      )}
    </div>
  );
};
