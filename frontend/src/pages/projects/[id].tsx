import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { api, getUser } from '@/lib/api';
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
  const user = getUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const { formatCurrency: formatCurrencyHook } = useCurrency();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [verifyModal, setVerifyModal] = useState<{ term: Term; action: 'approve' | 'reject' } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contract Form State
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState({
    contractNumber: '',
    totalValue: '',
    termCount: '3',
  });

  // Terms Form State
  const [showTermsForm, setShowTermsForm] = useState(false);
  const [termsForm, setTermsForm] = useState<Array<{ name: string; description: string; percentage: string }>>([]);

  // Progress Form State
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressForm, setProgressForm] = useState({
    description: '',
    claimPercentage: 50,
  });
  const [progressPhoto, setProgressPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Payment Form State
  const [paymentModal, setPaymentModal] = useState<Term | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    transactionRef: '',
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

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

      // Initialize terms form if contract exists but terms are incomplete
      if (data.contract && data.contract.terms.length < data.contract.termCount) {
        initializeTermsForm(data.contract.termCount - data.contract.terms.length);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Gagal memuat proyek');
    } finally {
      setLoading(false);
    }
  }

  function initializeTermsForm(count: number) {
    const terms = [];
    for (let i = 0; i < count; i++) {
      terms.push({ name: '', description: '', percentage: '' });
    }
    setTermsForm(terms);
  }

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault();

    if (!contractForm.contractNumber.trim()) {
      toast.error('Nomor kontrak wajib diisi');
      return;
    }
    if (!contractForm.totalValue || Number(contractForm.totalValue) <= 0) {
      toast.error('Nilai kontrak harus lebih dari 0');
      return;
    }
    if (!contractForm.termCount || Number(contractForm.termCount) < 1) {
      toast.error('Jumlah termin minimal 1');
      return;
    }

    setSubmitting(true);
    try {
      await api(`/projects/${id}/contract`, {
        method: 'POST',
        body: {
          contractNumber: contractForm.contractNumber.trim(),
          totalValue: Number(contractForm.totalValue),
          termCount: Number(contractForm.termCount),
        },
      });
      toast.success('Kontrak berhasil dibuat!');
      setShowContractForm(false);
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat kontrak');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateTerm(index: number) {
    const term = termsForm[index];
    if (!term.name.trim()) {
      toast.error('Nama termin wajib diisi');
      return;
    }
    if (!term.percentage || Number(term.percentage) <= 0 || Number(term.percentage) > 100) {
      toast.error('Persentase harus antara 1-100');
      return;
    }

    setSubmitting(true);
    try {
      const termNumber = (project?.contract?.terms.length || 0) + 1;
      const value = (Number(term.percentage) / 100) * (project?.contract?.totalValue || 0);

      await api(`/terms/contract/${project?.contract?.id}`, {
        method: 'POST',
        body: {
          termNumber,
          name: term.name.trim(),
          description: term.description.trim() || undefined,
          percentage: Number(term.percentage),
          value: Math.round(value),
        },
      });
      toast.success(`Termin ${termNumber} berhasil dibuat!`);
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat termin');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTerm) return;

    if (!progressForm.description.trim()) {
      toast.error('Deskripsi progress wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', progressForm.description.trim());
      formData.append('claimPercentage', progressForm.claimPercentage.toString());
      if (progressPhoto) {
        formData.append('photo', progressPhoto);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/progress/term/${selectedTerm.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload gagal');
      }

      toast.success('Progress berhasil diupload!');
      setShowProgressForm(false);
      setProgressForm({ description: '', claimPercentage: 50 });
      setProgressPhoto(null);
      setPhotoPreview(null);
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Gagal upload progress');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitForVerification() {
    if (!selectedTerm) return;

    setSubmitting(true);
    try {
      await api(`/progress/term/${selectedTerm.id}/submit`, {
        method: 'POST',
      });
      toast.success('Termin berhasil diajukan untuk verifikasi!');
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengajukan termin');
    } finally {
      setSubmitting(false);
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

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentModal) return;

    if (!paymentForm.transactionRef.trim()) {
      toast.error('Nomor referensi transfer wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      // For now, just send the transaction ref
      // In future, we can upload proof image
      await api(`/payments/term/${paymentModal.id}/confirm`, {
        method: 'POST',
        body: {
          transactionRef: paymentForm.transactionRef.trim(),
        },
      await paymentService.confirmPayment(termId, {
        transactionRef: `TRF-${Date.now()}`,
      });
      toast.success('Pembayaran dikonfirmasi');
      setPaymentModal(null);
      setPaymentForm({ transactionRef: '' });
      setPaymentProof(null);
      setPaymentProofPreview(null);
      loadProject();
    } catch (error: any) {
      toast.error(error.message || 'Gagal konfirmasi pembayaran');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setProgressPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const canVerify = (term: Term) => {
    if (term.status !== 'SUBMITTED') return false;
    if (!user) return false;

    const userRole = user.role;
    if (userRole !== 'SUPERVISOR' && userRole !== 'WITNESS') return false;

    const existingVerification = term.verifications.find(
      v => v.role === userRole && v.status !== 'PENDING'
    );
    return !existingVerification;
  };

  const canPay = (term: Term) => {
    return term.status === 'VALID' && user?.role === 'OWNER';
  };

  const canUploadProgress = (term: Term) => {
    return (term.status === 'DRAFT' || term.status === 'REJECTED') && user?.role === 'CONTRACTOR';
  };

  const canSubmitForVerification = (term: Term) => {
    return term.status === 'DRAFT' && term.progress.length > 0 && user?.role === 'CONTRACTOR';
  };

  // Calculate remaining percentage for terms
  const usedPercentage = project?.contract?.terms.reduce((sum, t) => sum + t.percentage, 0) || 0;
  const remainingPercentage = 100 - usedPercentage;

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

      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/projects" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Proyek
        </Link>

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

        {/* Create Contract Section (OWNER only, if no contract) */}
        {!project.contract && user?.role === 'OWNER' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Buat Kontrak</h2>
                <p className="text-sm text-gray-500">Proyek ini belum memiliki kontrak</p>
              </div>
              {!showContractForm && (
                <button
                  onClick={() => setShowContractForm(true)}
                  className="btn-primary"
                >
                  Buat Kontrak
                </button>
              )}
            </div>

            {showContractForm && (
              <form onSubmit={handleCreateContract} className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Nomor Kontrak <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="input"
                      placeholder="KONT-001-2026"
                      value={contractForm.contractNumber}
                      onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Nilai Kontrak (Rp) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className="input"
                      placeholder="100000000"
                      value={contractForm.totalValue}
                      onChange={(e) => setContractForm({ ...contractForm, totalValue: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="label">Jumlah Termin <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      max="10"
                      value={contractForm.termCount}
                      onChange={(e) => setContractForm({ ...contractForm, termCount: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Menyimpan...' : 'Simpan Kontrak'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContractForm(false)}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Create Terms Section (OWNER only, if contract exists but terms incomplete) */}
        {project.contract && project.contract.terms.length < project.contract.termCount && user?.role === 'OWNER' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Buat Termin</h2>
                <p className="text-sm text-gray-500">
                  {project.contract.terms.length} dari {project.contract.termCount} termin sudah dibuat
                  (Sisa: {remainingPercentage}% dari nilai kontrak)
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              {Array.from({ length: project.contract.termCount - project.contract.terms.length }).map((_, index) => {
                const termNumber = project.contract!.terms.length + index + 1;
                return (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Termin {termNumber}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="label">Nama Termin <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Contoh: Pekerjaan Pondasi"
                          value={termsForm[index]?.name || ''}
                          onChange={(e) => {
                            const newTerms = [...termsForm];
                            if (!newTerms[index]) newTerms[index] = { name: '', description: '', percentage: '' };
                            newTerms[index].name = e.target.value;
                            setTermsForm(newTerms);
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">Persentase (%) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          className="input"
                          placeholder={`Max: ${remainingPercentage}`}
                          min="1"
                          max={remainingPercentage}
                          value={termsForm[index]?.percentage || ''}
                          onChange={(e) => {
                            const newTerms = [...termsForm];
                            if (!newTerms[index]) newTerms[index] = { name: '', description: '', percentage: '' };
                            newTerms[index].percentage = e.target.value;
                            setTermsForm(newTerms);
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">Nilai (auto)</label>
                        <input
                          type="text"
                          className="input bg-gray-100"
                          value={termsForm[index]?.percentage
                            ? formatCurrency((Number(termsForm[index].percentage) / 100) * project.contract!.totalValue)
                            : '-'
                          }
                          disabled
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="label">Deskripsi</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Deskripsi pekerjaan termin (opsional)"
                        value={termsForm[index]?.description || ''}
                        onChange={(e) => {
                          const newTerms = [...termsForm];
                          if (!newTerms[index]) newTerms[index] = { name: '', description: '', percentage: '' };
                          newTerms[index].description = e.target.value;
                          setTermsForm(newTerms);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCreateTerm(index)}
                      disabled={submitting || !termsForm[index]?.name || !termsForm[index]?.percentage}
                      className="btn-primary mt-3"
                    >
                      {submitting ? 'Menyimpan...' : `Simpan Termin ${termNumber}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Terms */}
        {project.contract?.terms && project.contract.terms.length > 0 && (
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
                    {canUploadProgress(selectedTerm) && (
                      <button
                        onClick={() => setShowProgressForm(true)}
                        className="btn-primary"
                      >
                        Upload Progress
                      </button>
                    )}
                    {canSubmitForVerification(selectedTerm) && (
                      <button
                        onClick={handleSubmitForVerification}
                        disabled={submitting}
                        className="btn-success"
                      >
                        {submitting ? 'Memproses...' : 'Submit untuk Verifikasi'}
                      </button>
                    )}
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
                        onClick={() => setPaymentModal(selectedTerm)}
                        className="btn-primary"
                      >
                        Konfirmasi Pembayaran
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Progress Form (CONTRACTOR) */}
                {showProgressForm && canUploadProgress(selectedTerm) && (
                  <div className="card p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Upload Progress Pekerjaan</h4>
                    <form onSubmit={handleUploadProgress} className="space-y-4">
                      <div>
                        <label className="label">Foto Progress</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="input"
                          ref={fileInputRef}
                        />
                        {photoPreview && (
                          <img src={photoPreview} alt="Preview" className="mt-2 max-h-48 rounded-lg" />
                        )}
                      </div>
                      <div>
                        <label className="label">Deskripsi Pekerjaan <span className="text-red-500">*</span></label>
                        <textarea
                          className="input"
                          rows={4}
                          placeholder="Jelaskan pekerjaan yang sudah dilakukan..."
                          value={progressForm.description}
                          onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Klaim Persentase: {progressForm.claimPercentage}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progressForm.claimPercentage}
                          onChange={(e) => setProgressForm({ ...progressForm, claimPercentage: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={submitting} className="btn-primary">
                          {submitting ? 'Mengupload...' : 'Simpan Progress'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProgressForm(false);
                            setProgressPhoto(null);
                            setPhotoPreview(null);
                          }}
                          className="btn-secondary"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

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
                                src={p.photoUrl.startsWith('http') ? p.photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${p.photoUrl}`}
                                alt="Progress"
                                className="h-32 w-auto rounded-lg object-cover cursor-pointer hover:opacity-80"
                                onClick={() => window.open(p.photoUrl!.startsWith('http') ? p.photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${p.photoUrl}`, '_blank')}
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
                  <label className="label">Catatan {verifyModal.action === 'reject' && <span className="text-red-500">*</span>}</label>
                  <textarea
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder={verifyModal.action === 'reject' ? 'Jelaskan alasan penolakan...' : 'Masukkan catatan verifikasi (opsional)...'}
                    required={verifyModal.action === 'reject'}
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

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setPaymentModal(null)}
            />
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <form onSubmit={handlePayment}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Konfirmasi Pembayaran
                  </h3>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Nilai Termin</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(paymentModal.value)}
                    </p>
                  </div>
                  <div>
                    <label className="label">Nomor Referensi Transfer <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={paymentForm.transactionRef}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                      className="input"
                      placeholder="Contoh: TRF-123456789"
                      required
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentModal(null)}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
      </div>
    </>
  );
}
