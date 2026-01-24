import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { api, getUser } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const currentUser = getUser();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contractors, setContractors] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [witnesses, setWitnesses] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    contractorId: '',
    supervisorId: '',
    witnessId: '',
  });

  useEffect(() => {
    // Only OWNER can create projects
    if (currentUser?.role !== 'OWNER') {
      toast.error('Hanya Owner yang dapat membuat proyek');
      router.push('/projects');
      return;
    }
    loadUsers();
  }, [currentUser, router]);

  async function loadUsers() {
    try {
      const [contractorList, supervisorList, witnessList] = await Promise.all([
        api<User[]>('/auth/users/by-role?role=CONTRACTOR'),
        api<User[]>('/auth/users/by-role?role=SUPERVISOR'),
        api<User[]>('/auth/users/by-role?role=WITNESS'),
      ]);
      setContractors(contractorList);
      setSupervisors(supervisorList);
      setWitnesses(witnessList);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama proyek wajib diisi');
      return;
    }
    if (!formData.location.trim()) {
      toast.error('Lokasi proyek wajib diisi');
      return;
    }
    if (!formData.contractorId) {
      toast.error('Pilih kontraktor');
      return;
    }
    if (!formData.supervisorId) {
      toast.error('Pilih pengawas');
      return;
    }

    setSubmitting(true);
    try {
      const project = await api<{ id: string }>('/projects', {
        method: 'POST',
        body: {
          name: formData.name.trim(),
          location: formData.location.trim(),
          description: formData.description.trim() || undefined,
          contractorId: formData.contractorId,
          supervisorId: formData.supervisorId,
          witnessId: formData.witnessId || undefined,
        },
      });
      toast.success('Proyek berhasil dibuat!');
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat proyek');
    } finally {
      setSubmitting(false);
    }
  }

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
        <title>Buat Proyek Baru | AMANTRA</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/projects" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Proyek
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Buat Proyek Baru</h1>
          <p className="text-gray-600 mt-1">Isi form berikut untuk membuat proyek konstruksi baru</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Project Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Informasi Proyek
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Nama Proyek <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Contoh: Pembangunan Rumah Pak Budi"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="label">
                  Lokasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="Contoh: Jl. Merdeka No. 123, Jakarta Selatan"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Deskripsi singkat tentang proyek (opsional)"
                />
              </div>
            </div>
          </div>

          {/* Team Assignment Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Penugasan Tim
            </h2>

            <div className="space-y-4">
              {/* Contractor */}
              <div>
                <label htmlFor="contractorId" className="label">
                  Kontraktor <span className="text-red-500">*</span>
                </label>
                <select
                  id="contractorId"
                  value={formData.contractorId}
                  onChange={(e) => setFormData({ ...formData, contractorId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">-- Pilih Kontraktor --</option>
                  {contractors.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {contractors.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Belum ada kontraktor terdaftar di sistem
                  </p>
                )}
              </div>

              {/* Supervisor */}
              <div>
                <label htmlFor="supervisorId" className="label">
                  Pengawas <span className="text-red-500">*</span>
                </label>
                <select
                  id="supervisorId"
                  value={formData.supervisorId}
                  onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">-- Pilih Pengawas --</option>
                  {supervisors.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {supervisors.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Belum ada pengawas terdaftar di sistem
                  </p>
                )}
              </div>

              {/* Witness */}
              <div>
                <label htmlFor="witnessId" className="label">
                  Saksi
                </label>
                <select
                  id="witnessId"
                  value={formData.witnessId}
                  onChange={(e) => setFormData({ ...formData, witnessId: e.target.value })}
                  className="input"
                >
                  <option value="">-- Pilih Saksi (Opsional) --</option>
                  {witnesses.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Saksi akan membantu memverifikasi pekerjaan bersama pengawas
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Langkah Selanjutnya</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Setelah proyek dibuat, Anda perlu membuat <strong>Kontrak</strong> dan <strong>Termin Pembayaran</strong> untuk memulai pekerjaan.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/projects" className="btn-secondary">
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                'Buat Proyek'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
