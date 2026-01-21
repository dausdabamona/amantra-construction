import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { api, getUser } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  location: string;
  contract?: {
    contractNumber: string;
    totalValue: number;
    terms: Array<{
      id: string;
      termNumber: number;
      name: string;
      status: string;
      value: number;
    }>;
  };
}

interface Stats {
  totalProjects: number;
  totalValue: number;
  pendingVerifications: number;
  readyPayments: number;
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

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, totalValue: 0, pendingVerifications: 0, readyPayments: 0 });
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const projectsData = await api<Project[]>('/projects');
      setProjects(projectsData);

      // Calculate stats
      let totalValue = 0;
      let pendingVerifications = 0;
      let readyPayments = 0;

      projectsData.forEach(project => {
        if (project.contract) {
          totalValue += project.contract.totalValue;
          project.contract.terms?.forEach(term => {
            if (term.status === 'SUBMITTED') pendingVerifications++;
            if (term.status === 'VALID') readyPayments++;
          });
        }
      });

      setStats({
        totalProjects: projectsData.length,
        totalValue,
        pendingVerifications,
        readyPayments,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard | AMANTRA</title>
      </Head>

      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Selamat datang, {user?.name}
          </h1>
          <p className="text-gray-600">Berikut adalah ringkasan proyek Anda</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Proyek</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Nilai Kontrak</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Menunggu Verifikasi</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingVerifications}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Siap Bayar</p>
            <p className="text-2xl font-bold text-green-600">{stats.readyPayments}</p>
          </div>
        </div>

        {/* Projects List */}
        <div className="card">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Proyek Anda</h2>
              <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-500">
                Lihat semua
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Belum ada proyek
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-600 truncate">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-500">{project.location}</p>
                        {project.contract && (
                          <p className="text-xs text-gray-400 mt-1">
                            {project.contract.contractNumber} • {formatCurrency(project.contract.totalValue)}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {project.contract?.terms && (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {project.contract.terms.slice(0, 3).map((term) => (
                              <span
                                key={term.id}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[term.status]}`}
                              >
                                T{term.termNumber}: {statusLabels[term.status]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions based on role */}
        {user?.role === 'SUPERVISOR' || user?.role === 'WITNESS' ? (
          <div className="card p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tindakan Cepat</h3>
            <Link
              href="/projects"
              className="btn-primary text-sm"
            >
              Verifikasi Termin Pending
            </Link>
          </div>
        ) : null}

        {user?.role === 'OWNER' && stats.readyPayments > 0 ? (
          <div className="card p-4 bg-green-50 border border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              Ada {stats.readyPayments} termin siap dibayar
            </h3>
            <Link href="/payments" className="btn-success text-sm">
              Lihat Pembayaran
            </Link>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
