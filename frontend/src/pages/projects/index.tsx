import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  createdAt: string;
  owner: { name: string };
  contractor: { name: string };
  supervisor: { name: string };
  witness?: { name: string };
  contract?: {
    id: string;
    contractNumber: string;
    totalValue: number;
    termCount: number;
    terms: Array<{
      id: string;
      termNumber: number;
      name: string;
      status: string;
      value: number;
      percentage: number;
    }>;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  VERIFIED: 'bg-yellow-100 text-yellow-800',
  VALID: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PAID: 'bg-emerald-100 text-emerald-800',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  VERIFIED: 'Diverifikasi',
  VALID: 'Valid',
  REJECTED: 'Ditolak',
  PAID: 'Terbayar',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api<Project[]>('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Proyek | AMANTRA</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proyek</h1>
            <p className="text-gray-600">Daftar proyek konstruksi Anda</p>
          </div>
        </div>

        {loading ? (
          <div className="card p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Memuat...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2 text-gray-500">Belum ada proyek</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="card hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">{project.location}</p>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                        )}
                      </div>
                      {project.contract && (
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {project.contract.contractNumber}
                          </p>
                          <p className="text-lg font-bold text-primary-600">
                            {formatCurrency(project.contract.totalValue)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Team */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>
                        <span className="font-medium">Pemilik:</span> {project.owner.name}
                      </span>
                      <span>
                        <span className="font-medium">Kontraktor:</span> {project.contractor.name}
                      </span>
                      <span>
                        <span className="font-medium">Pengawas:</span> {project.supervisor.name}
                      </span>
                      {project.witness && (
                        <span>
                          <span className="font-medium">Saksi:</span> {project.witness.name}
                        </span>
                      )}
                    </div>

                    {/* Terms Progress */}
                    {project.contract?.terms && project.contract.terms.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Status Termin ({project.contract.terms.length} termin)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {project.contract.terms.map((term) => (
                            <div
                              key={term.id}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[term.status]}`}
                            >
                              T{term.termNumber}: {statusLabels[term.status]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
