import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth, useCurrency, useFormatDate } from '@/hooks/useCustom';
import { projectService, paymentService } from '@/services/api';

interface DashboardStats {
  totalProjects: number;
  totalValue: number;
  pendingVerifications: number;
  readyPayments: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const { formatCurrency } = useCurrency();

  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalValue: 0,
    pendingVerifications: 0,
    readyPayments: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load projects
      const projectsData = await projectService.getProjects(1, 5);
      const projects = projectsData.data || projectsData;
      setRecentProjects(projects.slice(0, 5));

      // Calculate stats
      let totalValue = 0;
      let pendingCount = 0;
      let readyPaymentsCount = 0;

      projects.forEach((project: any) => {
        if (project.contract) {
          totalValue += project.contract.totalValue || 0;
          project.contract.terms?.forEach((term: any) => {
            if (term.status === 'SUBMITTED') pendingCount++;
            if (term.status === 'VALID') readyPaymentsCount++;
          });
        }
      });

      // Load ready payments for Owner
      if (user?.role === 'OWNER') {
        try {
          const paymentsData = await paymentService.getReadyPayments();
          readyPaymentsCount = (paymentsData.data || paymentsData).length;
        } catch (error) {
          console.error('Failed to load payments:', error);
        }
      }

      setStats({
        totalProjects: projects.length,
        totalValue,
        pendingVerifications: pendingCount,
        readyPayments: readyPaymentsCount,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - AMANTRA Construction</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Selamat datang, {user?.name}!</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Role: <span className="font-semibold text-gray-900">{getRoleLabel(user?.role)}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Projects */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalProjects}</div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Proyek</p>
                  <p className="text-xs text-gray-400">Semua proyek</p>
                </div>
              </div>
            </div>

            {/* Total Value */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col">
                <p className="text-sm text-gray-500 mb-2">Total Nilai Kontrak</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>

            {/* Pending Verifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.pendingVerifications}</div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Verifikasi Pending</p>
                  <p className="text-xs text-gray-400">Menunggu approval</p>
                </div>
              </div>
            </div>

            {/* Ready Payments */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-emerald-600">{stats.readyPayments}</div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Siap Bayar</p>
                  <p className="text-xs text-gray-400">Pembayaran tersedia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons by Role */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user?.role === 'OWNER' && (
                <>
                  <Link href="/projects/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition-colors">
                    ➕ Buat Proyek
                  </Link>
                  <Link href="/projects" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center transition-colors">
                    📋 Lihat Proyek
                  </Link>
                  <Link href="/payments" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center transition-colors">
                    💳 Pembayaran
                  </Link>
                  <Link href="/audit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center transition-colors">
                    📊 Audit Log
                  </Link>
                </>
              )}

              {user?.role === 'CONTRACTOR' && (
                <>
                  <Link href="/projects" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition-colors">
                    📋 Proyek Saya
                  </Link>
                  <Link href="/projects/create" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center transition-colors">
                    ➕ Buat Proyek
                  </Link>
                  <Link href="/payments" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center transition-colors">
                    💳 Pembayaran
                  </Link>
                  <Link href="/audit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center transition-colors">
                    📊 Audit Log
                  </Link>
                </>
              )}

              {user?.role === 'SUPERVISOR' && (
                <>
                  <Link href="/verifications" className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-center transition-colors">
                    ✅ Verifikasi
                  </Link>
                  <Link href="/projects" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition-colors">
                    📋 Proyek
                  </Link>
                  <Link href="/audit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center transition-colors">
                    📊 Audit Log
                  </Link>
                </>
              )}

              {user?.role === 'WITNESS' && (
                <>
                  <Link href="/verifications" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center transition-colors">
                    ✅ Verifikasi Final
                  </Link>
                  <Link href="/projects" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition-colors">
                    📋 Proyek
                  </Link>
                  <Link href="/audit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center transition-colors">
                    📊 Audit Log
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Proyek Terbaru</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nama Proyek</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Lokasi</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nilai</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentProjects.map((project: any) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{project.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{project.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(project.contract?.totalValue || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Aktif
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link href={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-800">
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getRoleLabel(role?: string) {
  const labels: Record<string, string> = {
    OWNER: 'Pemberi Kerja',
    CONTRACTOR: 'Kontraktor',
    SUPERVISOR: 'Pengawas',
    WITNESS: 'Saksi Ahli',
  };
  return labels[role || ''] || 'User';
}


