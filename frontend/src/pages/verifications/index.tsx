import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { api, getUser } from '@/lib/api';
import toast from 'react-hot-toast';

interface Progress {
  id: string;
  description: string;
  photoUrl?: string;
  claimPercentage: number;
  createdAt: string;
  uploadedBy: { name: string };
}

interface PendingTerm {
  id: string;
  termNumber: number;
  name: string;
  description?: string;
  percentage: number;
  value: number;
  status: string;
  progress: Progress[];
  contract: {
    id: string;
    contractNumber: string;
    totalValue: number;
    project: {
      id: string;
      name: string;
      location: string;
      contractor: { name: string };
    };
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function VerificationsPage() {
  const user = getUser();
  const [pendingTerms, setPendingTerms] = useState<PendingTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<PendingTerm | null>(null);
  const [verifyModal, setVerifyModal] = useState<{ term: PendingTerm; action: 'approve' | 'reject' } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'SUPERVISOR' && user?.role !== 'WITNESS') {
      toast.error('Halaman ini hanya untuk Pengawas dan Saksi');
      return;
    }
    loadPendingVerifications();
  }, [user]);

  async function loadPendingVerifications() {
    try {
      const data = await api<PendingTerm[]>('/verifications/pending');
      setPendingTerms(data);
      if (data.length > 0) {
        setSelectedTerm(data[0]);
      }
    } catch (error) {
      console.error('Failed to load pending verifications:', error);
      toast.error('Gagal memuat data verifikasi');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(termId: string, status: 'APPROVED' | 'REJECTED', notes: string) {
    if (status === 'REJECTED' && !notes.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await api(`/verifications/term/${termId}`, {
        method: 'POST',
        body: { status, notes: notes.trim() || undefined },
      });
      toast.success(status === 'APPROVED' ? 'Termin berhasil disetujui!' : 'Termin ditolak');
      setVerifyModal(null);
      setVerifyNotes('');
      setSelectedTerm(null);
      loadPendingVerifications();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi');
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel = user?.role === 'SUPERVISOR' ? 'Pengawas' : 'Saksi';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Verifikasi Pending | AMANTRA</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pending</h1>
          <p className="text-gray-600 mt-1">
            Termin yang menunggu verifikasi Anda sebagai {roleLabel}
          </p>
        </div>

        {pendingTerms.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada verifikasi pending</h3>
            <p className="mt-2 text-gray-500">
              Semua termin sudah diverifikasi. Anda akan melihat termin baru di sini ketika kontraktor mengajukan progress.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pending Terms List */}
            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  Daftar Termin ({pendingTerms.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {pendingTerms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => setSelectedTerm(term)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedTerm?.id === term.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {term.contract.project.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Termin {term.termNumber}: {term.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Kontraktor: {term.contract.project.contractor.name}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-medium text-primary-600">
                          {formatCurrency(term.value)}
                        </p>
                        <span className="inline-block px-2 py-0.5 mt-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Diajukan
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Term Detail */}
            {selectedTerm && (
              <div className="lg:col-span-2 space-y-4">
                {/* Term Info */}
                <div className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link
                        href={`/projects/${selectedTerm.contract.project.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        {selectedTerm.contract.project.name} →
                      </Link>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">
                        Termin {selectedTerm.termNumber}: {selectedTerm.name}
                      </h3>
                      {selectedTerm.description && (
                        <p className="text-gray-600 mt-1">{selectedTerm.description}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                      Menunggu Verifikasi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Nilai Termin</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedTerm.value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Persentase</p>
                      <p className="text-lg font-bold text-gray-900">{selectedTerm.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">No. Kontrak</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTerm.contract.contractNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Kontraktor</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTerm.contract.project.contractor.name}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => setVerifyModal({ term: selectedTerm, action: 'approve' })}
                      className="btn-success flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Setujui Termin
                    </button>
                    <button
                      onClick={() => setVerifyModal({ term: selectedTerm, action: 'reject' })}
                      className="btn-danger flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tolak Termin
                    </button>
                  </div>
                </div>

                {/* Progress Reports */}
                <div className="card">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">
                      Laporan Progress ({selectedTerm.progress.length})
                    </h4>
                  </div>
                  {selectedTerm.progress.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Tidak ada laporan progress
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {selectedTerm.progress.map((p) => (
                        <div key={p.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {p.uploadedBy.name} • {formatDate(p.createdAt)}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Klaim: {p.claimPercentage}%
                            </span>
                          </div>
                          {p.photoUrl && (
                            <div className="mt-3">
                              <img
                                src={p.photoUrl.startsWith('http') ? p.photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${p.photoUrl}`}
                                alt="Foto Progress"
                                className="max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(p.photoUrl!.startsWith('http') ? p.photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${p.photoUrl}`, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Verifikasi sebagai {roleLabel}</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {user?.role === 'SUPERVISOR'
                          ? 'Sebagai Pengawas, pastikan pekerjaan telah dilaksanakan sesuai spesifikasi sebelum menyetujui.'
                          : 'Sebagai Saksi, pastikan verifikasi Pengawas sudah dilakukan dan pekerjaan sesuai dengan progress yang dilaporkan.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setVerifyModal(null)}
            />
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    verifyModal.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {verifyModal.action === 'approve' ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 ml-3">
                    {verifyModal.action === 'approve' ? 'Setujui Termin' : 'Tolak Termin'}
                  </h3>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Termin yang akan diverifikasi:</p>
                  <p className="font-medium text-gray-900">
                    {verifyModal.term.contract.project.name} - Termin {verifyModal.term.termNumber}
                  </p>
                  <p className="text-sm text-primary-600 font-medium">
                    {formatCurrency(verifyModal.term.value)}
                  </p>
                </div>

                <div>
                  <label className="label">
                    Catatan {verifyModal.action === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    className="input"
                    rows={4}
                    placeholder={
                      verifyModal.action === 'reject'
                        ? 'Jelaskan alasan penolakan secara detail...'
                        : 'Masukkan catatan verifikasi (opsional)...'
                    }
                    required={verifyModal.action === 'reject'}
                  />
                  {verifyModal.action === 'reject' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Catatan akan terlihat oleh kontraktor agar bisa memperbaiki pekerjaannya.
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button
                  onClick={() =>
                    handleVerification(
                      verifyModal.term.id,
                      verifyModal.action === 'approve' ? 'APPROVED' : 'REJECTED',
                      verifyNotes
                    )
                  }
                  disabled={submitting || (verifyModal.action === 'reject' && !verifyNotes.trim())}
                  className={verifyModal.action === 'approve' ? 'btn-success' : 'btn-danger'}
                >
                  {submitting ? 'Memproses...' : verifyModal.action === 'approve' ? 'Setujui' : 'Tolak'}
                </button>
                <button onClick={() => setVerifyModal(null)} className="btn-secondary">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
