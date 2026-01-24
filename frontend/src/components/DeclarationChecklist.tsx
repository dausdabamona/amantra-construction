import React, { useState } from 'react';

interface DeclarationChecklistProps {
  onChecklistChange: (completed: boolean) => void;
  isLoading?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  checked: boolean;
}

export const DeclarationChecklist: React.FC<DeclarationChecklistProps> = ({
  onChecklistChange,
  isLoading = false,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'terms',
      label: 'Saya setuju dengan Syarat dan Ketentuan Layanan',
      description:
        'Membaca dan memahami semua syarat, ketentuan, dan kebijakan privasi platform AMANTRA',
      required: true,
      checked: false,
    },
    {
      id: 'jurisdiction',
      label: 'Saya menerima yurisdiksi dan hukum yang berlaku',
      description:
        'Menerima bahwa semua transaksi tunduk pada hukum Republik Indonesia dan kewenangan pengadilan',
      required: true,
      checked: false,
    },
    {
      id: 'legal-capacity',
      label: 'Saya memiliki kapasitas hukum untuk membuat kontrak',
      description:
        'Mengkonfirmasi bahwa saya adalah badan hukum atau individu yang berwenang untuk membuat perjanjian',
      required: true,
      checked: false,
    },
    {
      id: 'age',
      label: 'Saya berusia minimal 18 tahun atau merupakan badan hukum yang sah',
      description: 'Konfirmasi umur atau status hukum untuk partisipasi di platform',
      required: true,
      checked: false,
    },
    {
      id: 'identity',
      label: 'Identitas saya telah diverifikasi melalui proses KYC',
      description:
        'Telah menyelesaikan proses Know Your Customer (KYC) dan verifikasi identitas',
      required: true,
      checked: false,
    },
    {
      id: 'funds',
      label: 'Dana yang saya gunakan adalah milik sah saya',
      description:
        'Menegaskan bahwa semua dana yang digunakan di platform adalah dana yang diperoleh secara legal',
      required: true,
      checked: false,
    },
  ]);

  const handleItemChange = (id: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    setItems(updatedItems);

    // Check if all required items are checked
    const allRequiredChecked = updatedItems
      .filter((item) => item.required)
      .every((item) => item.checked);

    onChecklistChange(allRequiredChecked);
  };

  const requiredItems = items.filter((item) => item.required);
  const checkedRequiredItems = requiredItems.filter((item) => item.checked);
  const allChecked = checkedRequiredItems.length === requiredItems.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Deklarasi Perjanjian</h3>
        <div className="text-sm text-gray-600">
          {checkedRequiredItems.length}/{requiredItems.length} disetujui
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Sebelum melanjutkan, mohon baca dan setujui semua pernyataan berikut:
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            allChecked ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${(checkedRequiredItems.length / requiredItems.length) * 100}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              item.checked
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleItemChange(item.id)}
              disabled={isLoading}
              className="mt-1 w-5 h-5 text-blue-600 rounded cursor-pointer"
              required={item.required}
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {item.label}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </p>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            </div>
            {item.checked && <span className="text-green-600 text-xl">✓</span>}
          </label>
        ))}
      </div>

      {/* Summary */}
      <div
        className={`p-4 rounded-lg border-2 ${
          allChecked
            ? 'border-green-300 bg-green-50'
            : 'border-yellow-300 bg-yellow-50'
        }`}
      >
        {allChecked ? (
          <p className="text-green-900 font-semibold">
            ✓ Semua pernyataan telah disetujui! Anda siap untuk mendeklarasikan intent.
          </p>
        ) : (
          <p className="text-yellow-900">
            ⚠️ Mohon setujui semua pernyataan yang ditandai dengan tanda * sebelum melanjutkan.
          </p>
        )}
      </div>
    </div>
  );
};

export default DeclarationChecklist;
