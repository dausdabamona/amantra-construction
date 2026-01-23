import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Hook untuk protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading };
}

// Hook untuk check role
export function useRequireRole(...roles: string[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!roles.includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, roles, router]);

  return { isLoading, hasAccess: user ? roles.includes(user.role) : false };
}

// Hook untuk format currency
export function useCurrency() {
  const formatCurrency = (value: number, locale = 'id-ID', currency = 'IDR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return { formatCurrency };
}

// Hook untuk format tanggal
export function useFormatDate() {
  const formatDate = (date: string | Date, locale = 'id-ID') => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string | Date, locale = 'id-ID') => {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return { formatDate, formatDateTime };
}

// Hook untuk term status
export function useTermStatus() {
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

  return { statusColors, statusLabels };
}

// Hook untuk verification status
export function useVerificationStatus() {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Menunggu',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  };

  return { statusColors, statusLabels };
}

// Hook untuk payment status
export function usePaymentStatus() {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    READY: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Menunggu',
    READY: 'Siap Bayar',
    PAID: 'Terbayar',
  };

  return { statusColors, statusLabels };
}
