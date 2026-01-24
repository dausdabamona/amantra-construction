import React, { useState } from 'react';
import { LegalTextSection } from '@/types/contract-review';

interface LegalContractTextViewProps {
  sections: LegalTextSection[] | null;
  isLoading: boolean;
  onAcknowledge: (acknowledged: boolean) => void;
  isAcknowledged: boolean;
}

export const LegalContractTextView: React.FC<LegalContractTextViewProps> = ({
  sections,
  isLoading,
  onAcknowledge,
  isAcknowledged,
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded w-full"></div>
        <div className="h-48 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return <div className="text-red-600">Teks kontrak legal tidak tersedia</div>;
  }

  // Filter sections by search term
  const filteredSections = sections.filter((section) =>
    searchTerm === '' ||
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Teks Legal & Syarat Kontrak Lengkap</h3>
        <p className="text-gray-600">Baca seluruh ketentuan hukum, kewajiban, kewajiban, dan syarat penghentian kontrak</p>
      </div>

      {/* Search Box */}
      <div>
        <input
          type="text"
          placeholder="🔍 Cari istilah dalam kontrak legal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-1">
            Menampilkan {filteredSections.length} dari {sections.length} bagian
          </p>
        )}
      </div>

      {/* Table of Contents */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">📑 Daftar Isi:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sections.map((section, idx) => (
            <a
              key={section.sectionNumber}
              href={`#section-${section.sectionNumber}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {idx + 1}. {section.title}
            </a>
          ))}
        </div>
      </div>

      {/* Legal Sections - Accordion */}
      <div className="space-y-3">
        {filteredSections.map((section, idx) => (
          <div
            key={section.sectionNumber}
            id={`section-${section.sectionNumber}`}
            className="border border-gray-300 rounded-lg overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.sectionNumber)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition"
            >
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">
                  {idx + 1}. {section.title}
                </p>
              </div>
              <span className="text-gray-600 ml-4">
                {expandedSections.includes(section.sectionNumber) ? '▼' : '▶'}
              </span>
            </button>

            {/* Section Content */}
            {expandedSections.includes(section.sectionNumber) && (
              <div className="px-4 py-4 border-t border-gray-200 bg-white space-y-4">
                {/* Main Content */}
                <div>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>

                {/* Key Obligations */}
                {section.keyObligations && section.keyObligations.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">✓ Kewajiban Utama:</p>
                    <ul className="space-y-1">
                      {section.keyObligations.map((obligation, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">
                          • {obligation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Liability Information */}
                {section.liabilityClauses && section.liabilityClauses.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm font-semibold text-red-900 mb-2">⚖️ Klausa Tanggung Jawab:</p>
                    <ul className="space-y-1">
                      {section.liabilityClauses.map((clause, idx) => (
                        <li key={idx} className="text-sm text-red-800">
                          • {clause}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Termination Conditions */}
                {section.terminationConditions && section.terminationConditions.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <p className="text-sm font-semibold text-orange-900 mb-2">🛑 Kondisi Penghentian:</p>
                    <ul className="space-y-1">
                      {section.terminationConditions.map((condition, idx) => (
                        <li key={idx} className="text-sm text-orange-800">
                          • {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-sm font-bold text-red-900 mb-2">⚖️ DISCLAIMER HUKUM</p>
        <p className="text-sm text-red-800 leading-relaxed">
          Kontrak ini mengikat secara hukum dan diatur oleh hukum Indonesia. Semua pihak yang menandatangani disarankan untuk berkonsultasi dengan konsultan hukum independen sebelum menandatangani. Ketika Anda menandatangani, Anda mengakui bahwa Anda telah membaca, memahami, dan setuju dengan semua syarat dan ketentuan yang ditetapkan di sini.
        </p>
      </div>

      {/* Key Points Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-3">📋 Ringkasan Poin-Poin Kunci:</p>
        <div className="space-y-2 text-sm text-blue-800">
          <p>✓ Kontrak ini adalah perjanjian mengikat antara pemberi kerja dan kontraktor</p>
          <p>✓ Semua pembayaran tunduk pada pencapaian milestone yang disepakati</p>
          <p>✓ Kontraktor bertanggung jawab atas kualitas pekerjaan dan kepatuhan keselamatan</p>
          <p>✓ Pemberi kerja berhak melakukan inspeksi kapan saja selama proyek</p>
          <p>✓ Penghentian dipicu oleh pelanggaran spesifik atau kegagalan milestone</p>
          <p>✓ Perselisihan diselesaikan melalui arbitrase menurut hukum Indonesia</p>
        </div>
      </div>

      {/* Acknowledgement */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAcknowledged}
            onChange={(e) => onAcknowledge(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            <strong>Saya telah membaca seluruh teks legal kontrak</strong> termasuk semua kewajiban, ketentuan tanggung jawab, dan kondisi penghentian, dan memahami implikasinya
          </span>
        </label>
      </div>
    </div>
  );
};
