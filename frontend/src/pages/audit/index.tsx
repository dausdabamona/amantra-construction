import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { api, getUser } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const actionLabels: Record<string, string> = {
  CREATE: 'Membuat',
  UPDATE: 'Mengupdate',
  DELETE: 'Menghapus',
  SUBMIT_PROGRESS: 'Submit Progress',
  VERIFY_APPROVE: 'Menyetujui',
  VERIFY_REJECT: 'Menolak',
  PAYMENT_CONFIRM: 'Konfirmasi Pembayaran',
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  SUBMIT_PROGRESS: 'bg-yellow-100 text-yellow-800',
  VERIFY_APPROVE: 'bg-emerald-100 text-emerald-800',
  VERIFY_REJECT: 'bg-red-100 text-red-800',
  PAYMENT_CONFIRM: 'bg-purple-100 text-purple-800',
};

const entityLabels: Record<string, string> = {
  PROJECT: 'Proyek',
  CONTRACT: 'Kontrak',
  TERM: 'Termin',
  PROGRESS: 'Progress',
  VERIFICATION: 'Verifikasi',
  PAYMENT: 'Pembayaran',
  USER: 'Pengguna',
};

const roleLabels: Record<string, string> = {
  OWNER: 'Pemilik',
  CONTRACTOR: 'Kontraktor',
  SUPERVISOR: 'Pengawas',
  WITNESS: 'Saksi',
};

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  return formatDateTime(date);
}

export default function AuditLogPage() {
  const user = getUser();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  useEffect(() => {
    loadAuditLogs();
  }, [limit]);

  async function loadAuditLogs() {
    try {
      const data = await api<AuditLog[]>(`/audit?limit=${limit}`);
      setAuditLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Gagal memuat audit log');
    } finally {
      setLoading(false);
    }
  }

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    if (filterEntity && log.entityType !== filterEntity) return false;
    if (filterAction && log.action !== filterAction) return false;
    return true;
  });

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, AuditLog[]>);

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
        <title>Audit Log | AMANTRA</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-600 mt-1">
              Riwayat semua aktivitas dalam sistem
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="">Semua Entitas</option>
              {Object.entries(entityLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="">Semua Aksi</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="input py-1.5 text-sm"
            >
              <option value={20}>20 terbaru</option>
              <option value={50}>50 terbaru</option>
              <option value={100}>100 terbaru</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Aktivitas</p>
            <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Verifikasi</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredLogs.filter(l => l.action.startsWith('VERIFY')).length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Pembayaran</p>
            <p className="text-2xl font-bold text-purple-600">
              {filteredLogs.filter(l => l.action === 'PAYMENT_CONFIRM').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Progress</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredLogs.filter(l => l.action === 'SUBMIT_PROGRESS').length}
            </p>
          </div>
        </div>

        {/* Timeline */}
        {filteredLogs.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada aktivitas</h3>
            <p className="mt-2 text-gray-500">
              {filterEntity || filterAction
                ? 'Tidak ada aktivitas yang sesuai dengan filter'
                : 'Belum ada aktivitas yang tercatat'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs).map(([date, logs]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-3 sticky top-0 bg-gray-100 py-2">
                  {date}
                </h3>
                <div className="card divide-y divide-gray-200">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {log.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-medium text-gray-900">{log.user.name}</span>
                            <span className="text-xs text-gray-400">
                              ({roleLabels[log.user.role] || log.user.role})
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              actionColors[log.action] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {actionLabels[log.action] || log.action}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              {entityLabels[log.entityType] || log.entityType}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-600">{log.description}</p>

                          {/* Changes */}
                          {(log.oldValue || log.newValue) && (
                            <div className="mt-2 text-xs">
                              {log.oldValue && (
                                <div className="flex items-start gap-2">
                                  <span className="text-red-500 font-medium">-</span>
                                  <span className="text-gray-500 line-through">{log.oldValue}</span>
                                </div>
                              )}
                              {log.newValue && (
                                <div className="flex items-start gap-2">
                                  <span className="text-green-500 font-medium">+</span>
                                  <span className="text-gray-700">{log.newValue}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <p className="mt-2 text-xs text-gray-400">
                            {formatRelativeTime(log.createdAt)} • {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredLogs.length >= limit && (
          <div className="text-center">
            <button
              onClick={() => setLimit(limit + 50)}
              className="btn-secondary"
            >
              Muat Lebih Banyak
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
