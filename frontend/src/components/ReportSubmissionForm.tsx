import React, { useState, useRef } from 'react';
import { useSelectedMilestone, useOperationStore } from '@/stores/useOperationStore';
import { ProgressReportInput } from '@/types/operation';

interface ReportSubmissionFormProps {
  contractId: string;
  onSubmit?: (data: ProgressReportInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * ReportSubmissionForm - Interface for contractors to submit progress reports
 * Includes: milestone selection, progress percentage, photo upload, notes
 */
export const ReportSubmissionForm: React.FC<ReportSubmissionFormProps> = ({
  contractId,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const selectedMilestone = useSelectedMilestone();
  const [progressPercentage, setProgressPercentage] = useState(50);
  const [progressDescription, setProgressDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedMilestone) {
    return (
      <div className={`border rounded-lg bg-gray-50 border-gray-300 p-6 ${className}`}>
        <p className="text-gray-600 text-sm">Silakan pilih milestone terlebih dahulu</p>
      </div>
    );
  }

  // Handle file selection
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos((prev) => [...prev, ...files]);

    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string' && e.target) {
          setPhotoPreviewUrls((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!progressDescription.trim()) {
      errors.push('Deskripsi kemajuan tidak boleh kosong');
    }

    if (progressPercentage < 0 || progressPercentage > 100) {
      errors.push('Persentase kemajuan harus antara 0-100%');
    }

    if (photos.length === 0) {
      errors.push('Minimal 1 foto bukti harus diunggah');
    }

    if (photos.length > 5) {
      errors.push('Maksimal 5 foto saja');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData: ProgressReportInput = {
      milestoneNumber: selectedMilestone.milestoneNumber,
      progressDescription,
      completionPercentage: progressPercentage,
      photoUrls: photoPreviewUrls,
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit?.(formData);
      // Reset form on success
      setProgressPercentage(50);
      setProgressDescription('');
      setNotes('');
      setPhotos([]);
      setPhotoPreviewUrls([]);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`border rounded-lg bg-white border-blue-300 p-6 space-y-6 ${className}`}
    >
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">Ajukan Laporan Kemajuan</h3>
        <p className="text-sm text-gray-600 mt-1">
          Milestone #{selectedMilestone.milestoneNumber}: {selectedMilestone.description}
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded p-4">
          <p className="text-xs font-semibold text-red-900 uppercase mb-2">
            ❌ Validasi Gagal:
          </p>
          <ul className="space-y-1">
            {validationErrors.map((error, idx) => (
              <li key={idx} className="text-xs text-red-800">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress Percentage Slider */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">
          Persentase Kemajuan Pekerjaan: <span className="text-blue-600">{progressPercentage}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={progressPercentage}
          onChange={(e) => setProgressPercentage(Number(e.target.value))}
          disabled={isLoading}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Progress Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
          Deskripsi Kemajuan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={progressDescription}
          onChange={(e) => setProgressDescription(e.target.value)}
          disabled={isLoading}
          placeholder="Jelaskan detail pekerjaan yang telah dilakukan, tantangan yang dihadapi, dan rencana selanjutnya..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-600">
          Minimal 20 karakter, jelaskan semua detail pekerjaan yang telah diselesaikan
        </p>
      </div>

      {/* Photo Upload */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">
          Bukti Foto Pekerjaan <span className="text-red-500">*</span>
        </label>

        {/* Photo Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoSelect}
            disabled={isLoading}
            className="hidden"
          />
          <div className="text-3xl mb-2">📸</div>
          <p className="text-sm font-semibold text-gray-900">
            Klik atau drag untuk mengupload foto
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Format: JPG, PNG, WebP (Maksimal 5 MB per foto)
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {photos.length} / 5 foto terpilih
          </p>
        </div>

        {/* Photo Previews */}
        {photoPreviewUrls.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700">Pratinjau Foto:</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photoPreviewUrls.map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    disabled={isLoading}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold disabled:opacity-50"
                  >
                    ✕
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {photos[idx].name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-semibold text-gray-900">
          Catatan Tambahan (Opsional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          placeholder="Informasi tambahan, hambatan, atau catatan penting lainnya..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* Deliverables Checklist */}
      <div className="bg-gray-50 rounded p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-700 uppercase">
          Deliverables Milestone:
        </p>
        {selectedMilestone.deliverables.map((deliverable, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              id={`deliverable-${idx}`}
              disabled
              defaultChecked={deliverable.completed}
              className="mt-1"
            />
            <label htmlFor={`deliverable-${idx}`} className="text-gray-700">
              {deliverable.description}
            </label>
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Mengirim...
            </>
          ) : (
            <>
              <span>📤</span>
              Kirim Laporan
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">💡 Tips:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Ambil foto dari berbagai sudut untuk dokumentasi menyeluruh</li>
          <li>Pastikan foto jelas dan terang agar mudah diverifikasi</li>
          <li>Berikan deskripsi yang jelas dan detail tentang pekerjaan</li>
          <li>Laporan akan diverifikasi oleh ProjectOwner dalam 2-3 hari kerja</li>
        </ul>
      </div>
    </form>
  );
};

export default ReportSubmissionForm;
