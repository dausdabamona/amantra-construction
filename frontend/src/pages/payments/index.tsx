import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { api, getUser } from '@/lib/api';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'READY' | 'PAID';
  proofUrl?: string;
  transactionRef?: string;
  paidAt?: string;
  term: {
    id: string;
    termNumber: number;
    name: string;
    contract: {
      contractNumber: string;
      project: {
        id: string;
        name: string;
      };
    };
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  READY: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  READY: 'Siap Bayar',
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PaymentsPage() {
  const user = getUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      const data = await api<Payment[]>('/payments');
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(termId: string) {
    setSubmitting(termId);
    try {
      await api(`/payments/term/${termId}/confirm`, {
        method: 'POST',
        body: {
          transactionRef: `TRF-${Date.now()}`,
        },
      });
      toast.success('Pembayaran dikonfirmasi');
      loadPayments();
    } catch (error: any) {
      toast.error(error.message || 'Gagal konfirmasi pembayaran');
    } finally {
      setSubmitting(null);
    }
  }

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const stats = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    paid: payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
    ready: payments.filter((p) => p.status === 'READY').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <Layout>
      <Head>
        <title>Pembayaran | AMANTRA</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-gray-600">Kelola pembayaran termin proyek</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Pembayaran</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.total)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Terbayar</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.paid)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Siap Bayar</p>
            <p className="text-lg font-bold text-yellow-600">{formatCurrency(stats.ready)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-lg font-bold text-gray-600">{formatCurrency(stats.pending)}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'READY', label: 'Siap Bayar' },
            { value: 'PAID', label: 'Terbayar' },
            { value: 'PENDING', label: 'Pending' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="card p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            Tidak ada pembayaran {filter !== 'all' ? 'dengan status ini' : ''}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="card">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                          {statusLabels[payment.status]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {payment.term.contract.contractNumber}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">
                        Termin {payment.term.termNumber}: {payment.term.name}
                      </h3>
                      <Link
                        href={`/projects/${payment.term.contract.project.id}`}
                        className="text-sm text-primary-600 hover:text-primary-500"
                      >
                        {payment.term.contract.project.name}
                      </Link>
                    </div>

                    <div className="mt-4 lg:mt-0 lg:text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.transactionRef && (
                        <p className="text-sm text-gray-500">Ref: {payment.transactionRef}</p>
                      )}
                      {payment.paidAt && (
                        <p className="text-sm text-gray-500">Dibayar: {formatDate(payment.paidAt)}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {payment.status === 'READY' && user?.role === 'OWNER' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleConfirmPayment(payment.term.id)}
                        disabled={submitting === payment.term.id}
                        className="btn-primary"
                      >
                        {submitting === payment.term.id ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
