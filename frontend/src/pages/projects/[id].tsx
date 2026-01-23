import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, verificationService, paymentService } from '@/services/api';
import { useRequireAuth, useCurrency } from '@/hooks/useCustom';

interface Project {
  id: string;
  name: string;
  description?: string;
  location: string;
  status: string;
  budget: number;
  contractId?: string;
  owner: { id: string; name: string };
  contractor: { id: string; name: string };
  supervisor: { id: string; name: string };
  witness?: { id: string; name: string };
  contract?: {
    id: string;
    contractNumber: string;
    totalValue: number;
    termCount?: number;
    terms?: Term[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Term {
  id: string;
  termNumber: number;
  name: string;
  description: string;
  status: string;
  amount: number;
  percentage: number;
  value: number;
  createdAt: string;
  updatedAt: string;
  progress: Array<{
    id: string;
    description: string;
    photoUrl?: string;
    claimPercentage: number;
    createdAt: string;
    uploadedBy?: {
      id: string;
      name: string;
    };
  }>;
  verifications: Array<{
    id: string;
    role: 'SUPERVISOR' | 'WITNESS';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    notes?: string;
    verifier?: {
      id: string;
      name: string;
    };
  }>;
  payment?: {
    id: string;
    status: string;
    amount: number;
    transactionRef?: string;
    proofUrl?: string;
    confirmedAt?: string;
    paidAt?: string;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-300',
  VERIFIED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  VALID: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  VERIFIED: 'Diverifikasi',
  VALID: 'Valid - Siap Bayar',
  REJECTED: 'Ditolak',
  PAID: 'Terbayar',
};

const verificationStatusColors: Record<string, string> = {
  PENDING: 'text-gray-500',
  APPROVED: 'text-green-600',
  REJECTED: 'text-red-600',
};

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
    month: 'long',
    year: 'numeric',
  });
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const { formatCurrency: formatCurrencyHook } = useCurrency();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [verifyModal, setVerifyModal] = useState<{ term: Term; action: 'approve' | 'reject' } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const data = await projectService.getProjectById(id as string);
      setProject(data);
      if (data.contract?.terms && data.contract.terms.length > 0) {
        setSelectedTerm(data.contract.terms[0]);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Gagal memuat proyek');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(termId: string, status: 'APPROVED' | 'REJECTED', notes: string) {
    setSubmitting(true);
    try {
      await verificationService.createVerification(termId, {
        status,
        notes,
      });
      toast.success(status === 'APPROVED' ? 'Berhasil disetujui' : 'Berhasil ditolak');
      setVerifyModal(null);
      setVerifyNotes('');
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayment(termId: string) {
    setSubmitting(true);
    try {
      await paymentService.confirmPayment(termId, {
        transactionRef: `TRF-${Date.now()}`,
      });
      toast.success('Pembayaran dikonfirmasi');
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Gagal konfirmasi pembayaran');
    } finally {
      setSubmitting(false);
    }
  }

  const canVerify = (term: Term) => {
    if (term.status !== 'SUBMITTED') return false;
    if (!user) return false;

    const userRole = user.role;
    if (userRole !== 'SUPERVISOR' && userRole !== 'WITNESS') return false;

    // Check if user already verified
    const existingVerification = term.verifications.find(
      v => v.role === userRole && v.status !== 'PENDING'
    );
    return !existingVerification;
  };

  const canPay = (term: Term) => {
    return term.status === 'VALID' && user?.role === 'OWNER';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat proyek...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-500">Proyek tidak ditemukan</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{project.name} | AMANTRA</title>
      </Head>

      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Project Header */}
          <div className="card p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-500 mt-1">{project.location}</p>
                {project.description && (
                  <p className="text-gray-600 mt-2">{project.description}</p>
                )}
              </div>
              {project.contract && (
                <div className="mt-4 lg:mt-0 lg:text-right">
                  <p className="text-sm text-gray-500">{project.contract.contractNumber}</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(project.contract.totalValue)}
                  </p>
                <p className="text-sm text-gray-500">{project.contract.termCount} termin</p>
              </div>
            )}
          </div>

          {/* Team */}
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Pemilik</p>
              <p className="text-sm font-medium text-gray-900">{project.owner.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Kontraktor</p>
              <p className="text-sm font-medium text-gray-900">{project.contractor.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Pengawas</p>
              <p className="text-sm font-medium text-gray-900">{project.supervisor.name}</p>
            </div>
            {project.witness && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Saksi</p>
                <p className="text-sm font-medium text-gray-900">{project.witness.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Terms */}
        {project.contract?.terms && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Terms List */}
            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Daftar Termin</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {project.contract.terms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => setSelectedTerm(term)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedTerm?.id === term.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Termin {term.termNumber}
                        </p>
                        <p className="text-sm text-gray-500">{term.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {term.percentage}%
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[term.status]}`}>
                          {statusLabels[term.status]}
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
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Termin {selectedTerm.termNumber}: {selectedTerm.name}
                      </h3>
                      {selectedTerm.description && (
                        <p className="text-gray-600 mt-1">{selectedTerm.description}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[selectedTerm.status]}`}>
                      {statusLabels[selectedTerm.status]}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nilai Termin</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(selectedTerm.value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Persentase</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedTerm.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {canVerify(selectedTerm) && (
                      <>
                        <button
                          onClick={() => setVerifyModal({ term: selectedTerm, action: 'approve' })}
                          className="btn-success"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => setVerifyModal({ term: selectedTerm, action: 'reject' })}
                          className="btn-danger"
                        >
                          Tolak
                        </button>
                      </>
                    )}
                    {canPay(selectedTerm) && (
                      <button
                        onClick={() => handlePayment(selectedTerm.id)}
                        disabled={submitting}
                        className="btn-primary"
                      >
                        {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="card">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Progres Pekerjaan</h4>
                  </div>
                  {selectedTerm.progress.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Belum ada laporan progres
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {selectedTerm.progress.map((p) => (
                        <div key={p.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {p.uploadedBy?.name || 'Tidak diketahui'} • {formatDate(p.createdAt)}
                              </p>
                            </div>
                            <span className="badge-info">{p.claimPercentage}%</span>
                          </div>
                          {p.photoUrl && (
                            <div className="mt-2">
                              <img
                                src={p.photoUrl}
                                alt="Progress"
                                className="h-32 w-auto rounded-lg object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verifications */}
                <div className="card">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Status Verifikasi</h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* Supervisor Verification */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.status === 'APPROVED'
                              ? 'bg-green-100'
                              : selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.status === 'REJECTED'
                              ? 'bg-red-100'
                              : 'bg-gray-100'
                          }`}>
                            {selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.status === 'APPROVED' ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.status === 'REJECTED' ? (
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Pengawas</p>
                            <p className="text-xs text-gray-500">
                              {selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.verifier?.name || 'Menunggu'}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${
                          verificationStatusColors[
                            selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.status || 'PENDING'
                          ]
                        }`}>
                          {selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.status === 'APPROVED'
                            ? 'Disetujui'
                            : selectedTerm.verifications.find(v => v.role === 'SUPERVISOR')?.status === 'REJECTED'
                            ? 'Ditolak'
                            : 'Pending'}
                        </span>
                      </div>

                      {/* Witness Verification */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedTerm.verifications.find(v => v.role === 'WITNESS')?.status === 'APPROVED'
                              ? 'bg-green-100'
                              : selectedTerm.verifications.find(v => v.role === 'WITNESS')?.status === 'REJECTED'
                              ? 'bg-red-100'
                              : 'bg-gray-100'
                          }`}>
                            {selectedTerm.verifications.find(v => v.role === 'WITNESS')?.status === 'APPROVED' ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : selectedTerm.verifications.find(v => v.role === 'WITNESS')?.status === 'REJECTED' ? (
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Saksi</p>
                            <p className="text-xs text-gray-500">
                              {selectedTerm.verifications.find(v => v.role === 'WITNESS')?.verifier?.name || 'Menunggu'}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${
                          verificationStatusColors[
                            selectedTerm.verifications.find(v => v.role === 'WITNESS')?.status || 'PENDING'
                          ]
                        }`}>
                          {selectedTerm.verifications.find(v => v.role === 'WITNESS')?.status === 'APPROVED'
                            ? 'Disetujui'
                            : selectedTerm.verifications.find(v => v.role === 'WITNESS')?.status === 'REJECTED'
                            ? 'Ditolak'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                {selectedTerm.payment && (
                  <div className="card">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900">Status Pembayaran</h4>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedTerm.payment.amount)}
                          </p>
                          {selectedTerm.payment.transactionRef && (
                            <p className="text-sm text-gray-500">
                              Ref: {selectedTerm.payment.transactionRef}
                            </p>
                          )}
                          {selectedTerm.payment.paidAt && (
                            <p className="text-sm text-gray-500">
                              Dibayar: {formatDate(selectedTerm.payment.paidAt)}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedTerm.payment.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : selectedTerm.payment.status === 'READY'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTerm.payment.status === 'PAID'
                            ? 'Terbayar'
                            : selectedTerm.payment.status === 'READY'
                            ? 'Siap Bayar'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {verifyModal.action === 'approve' ? 'Setujui Termin' : 'Tolak Termin'}
                </h3>
                <div>
                  <label className="label">Catatan</label>
                  <textarea
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Masukkan catatan verifikasi..."
                  />
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
                  disabled={submitting}
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
      </div>
    </>
  );
}
