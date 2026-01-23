# 🏗️ AMANTRA Construction - Frontend Implementation Guide

## Status: Infrastruktur Siap ✅

### Yang Sudah Dibuat:

1. **API Service Layer** (`src/services/api.ts`)
   - ✅ Semua endpoints terintegrasi
   - ✅ Axios interceptor untuk auto-token
   - ✅ Error handling

2. **Auth Context** (`src/contexts/AuthContext.tsx`)
   - ✅ Login/logout management
   - ✅ User session persistence
   - ✅ Token handling

3. **App Context** (`src/contexts/AppContext.tsx`)
   - ✅ Global app state
   - ✅ Notifications system
   - ✅ Project/term state

4. **Custom Hooks** (`src/hooks/useCustom.ts`)
   - ✅ `useRequireAuth()` - Protected routes
   - ✅ `useRequireRole()` - Role-based access
   - ✅ `useCurrency()` - IDR formatting
   - ✅ `useFormatDate()` - Date formatting
   - ✅ Status colors & labels hooks

5. **Login Page** (`src/pages/auth/login.tsx`)
   - ✅ Terintegrasi dengan Auth Context
   - ✅ Form validation
   - ✅ Quick login buttons untuk demo

6. **Dashboard** (`src/pages/dashboard/index.tsx`)
   - ✅ Role-based dashboard
   - ✅ Stats cards
   - ✅ Quick action buttons
   - ✅ Recent projects table

7. **Providers Setup** (`src/pages/_app.tsx`)
   - ✅ AuthProvider + AppProvider wrapped
   - ✅ React Hot Toast configured

---

## 🚀 Pages Masih Perlu Dibuat:

### Tier 1 - WAJIB (untuk MVP functionality)

```
✅ /auth/login                 - SUDAH JADI
✅ /dashboard                  - SUDAH JADI
⏳ /projects                   - LIST + GRID VIEW
⏳ /projects/[id]              - DETAIL + EDIT
⏳ /projects/create            - FORM BUAT PROYEK
⏳ /contracts/[id]             - CREATE TERMIN
⏳ /verifications              - LIST PENDING
⏳ /verifications/[id]         - APPROVE/REJECT
⏳ /payments                   - LIST PEMBAYARAN
⏳ /payments/[id]              - CONFIRM BAYAR
⏳ /audit                      - LOG VIEWER
```

---

## 💻 Template Code untuk Pages (Copy-Paste Ready)

### 1. Projects List Page (`src/pages/projects/index.tsx`)

```tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth, useCurrency } from '@/hooks/useCustom';
import { projectService } from '@/services/api';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const { formatCurrency } = useCurrency();

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
    }
  }, [user, authLoading]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data.data || data);
    } catch (error) {
      toast.error('Gagal memuat proyek');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <>
      <Head>
        <title>Proyek - AMANTRA</title>
      </Head>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Proyek</h1>
            {(user?.role === 'OWNER' || user?.role === 'CONTRACTOR') && (
              <Link href="/projects/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                ➕ Buat Proyek
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-gray-600 text-sm mt-2">{p.location}</p>
                  <p className="text-green-600 font-bold mt-4">
                    {formatCurrency(p.contract?.totalValue || 0)}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    {p.contract?.terms?.length || 0} termin
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

### 2. Project Detail + Terms Page (`src/pages/projects/[id].tsx`)

```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth, useCurrency, useTermStatus } from '@/hooks/useCustom';
import { projectService, termService, progressService } from '@/services/api';

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const { formatCurrency } = useCurrency();
  const { statusLabels, statusColors } = useTermStatus();

  const [project, setProject] = useState<any>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && id) {
      loadData();
    }
  }, [id, authLoading]);

  const loadData = async () => {
    try {
      const projectData = await projectService.getProjectById(id as string);
      setProject(projectData);

      if (projectData.contract?.id) {
        const termsData = await termService.getTermsByContract(projectData.contract.id);
        setTerms(termsData.data || termsData);
      }
    } catch (error) {
      toast.error('Gagal memuat detail proyek');
      router.push('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-600">Proyek tidak ditemukan</p>
        <Link href="/projects" className="text-blue-600 mt-4">← Kembali ke Proyek</Link>
      </div>
    </div>;
  }

  return (
    <>
      <Head>
        <title>{project.name} - AMANTRA</title>
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <Link href="/projects" className="text-blue-600 text-sm mb-4">← Kembali ke Proyek</Link>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.location}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-gray-500 text-sm">Pemberi Kerja</p>
                <p className="font-semibold">{project.owner?.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Kontraktor</p>
                <p className="font-semibold">{project.contractor?.name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pengawas</p>
                <p className="font-semibold">{project.supervisor?.name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Nilai Kontrak</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(project.contract?.totalValue || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('terms')}
                className={`px-6 py-4 font-medium ${activeTab === 'terms' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              >
                Termin ({terms.length})
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Informasi Proyek</h3>
                  <p className="text-gray-600">{project.description}</p>
                </div>
              )}

              {activeTab === 'terms' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Daftar Termin</h3>
                  <div className="space-y-4">
                    {terms.map((term: any) => (
                      <Link key={term.id} href={`/terms/${term.id}`}>
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">
                                Termin {term.termNumber}: {term.name}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">Nilai: {formatCurrency(term.value)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[term.status]}`}>
                              {statusLabels[term.status]}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

### 3. Verification Page (`src/pages/verifications/index.tsx`)

```tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireRole, useFormatDate } from '@/hooks/useCustom';
import { verificationService } from '@/services/api';

export default function VerificationsPage() {
  const { user } = useAuth();
  const { isLoading: authLoading, hasAccess } = useRequireRole('SUPERVISOR', 'WITNESS');
  const { formatDate } = useFormatDate();

  const [verifications, setVerifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadVerifications();
    }
  }, [user, authLoading]);

  const loadVerifications = async () => {
    try {
      const data = await verificationService.getPendingVerifications();
      setVerifications(data.data || data);
    } catch (error) {
      toast.error('Gagal memuat verifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!hasAccess) {
    return <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-red-600">Anda tidak memiliki akses ke halaman ini</p>
      </div>
    </div>;
  }

  return (
    <>
      <Head>
        <title>Verifikasi - AMANTRA</title>
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Verifikasi Termin</h1>

          {verifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Tidak ada verifikasi pending</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((v: any) => (
                <Link key={v.id} href={`/verifications/${v.id}`}>
                  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg text-gray-900">
                          Termin: {v.term?.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Proyek: {v.term?.contract?.project?.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {formatDate(v.createdAt)}
                        </p>
                      </div>
                      <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Pending
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

### 4. Payments Page (`src/pages/payments/index.tsx`)

```tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth, useCurrency, usePaymentStatus, useFormatDate } from '@/hooks/useCustom';
import { paymentService } from '@/services/api';

export default function PaymentsPage() {
  const { user } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const { formatCurrency } = useCurrency();
  const { statusLabels, statusColors } = usePaymentStatus();
  const { formatDate } = useFormatDate();

  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, ready, paid

  useEffect(() => {
    if (!authLoading && user) {
      loadPayments();
    }
  }, [user, authLoading]);

  const loadPayments = async () => {
    try {
      let data;
      if (filter === 'ready') {
        data = await paymentService.getReadyPayments();
      } else {
        // Get all payments - you may need to create this endpoint
        data = [];
      }
      setPayments(data.data || data);
    } catch (error) {
      toast.error('Gagal memuat pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <>
      <Head>
        <title>Pembayaran - AMANTRA</title>
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Pembayaran</h1>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {['all', 'pending', 'ready', 'paid'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'pending' ? 'Menunggu' : f === 'ready' ? 'Siap Bayar' : 'Terbayar'}
              </button>
            ))}
          </div>

          {payments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Tidak ada pembayaran</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Termin</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Proyek</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nilai</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {p.term?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {p.term?.contract?.project?.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                          {statusLabels[p.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {p.status === 'READY' && user?.role === 'OWNER' ? (
                          <Link href={`/payments/${p.id}`} className="text-blue-600 hover:text-blue-800">
                            Bayar
                          </Link>
                        ) : (
                          <Link href={`/payments/${p.id}`} className="text-blue-600 hover:text-blue-800">
                            Lihat
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

### 5. Audit Log Page (`src/pages/audit/index.tsx`)

```tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth, useFormatDate } from '@/hooks/useCustom';
import { auditService } from '@/services/api';

export default function AuditPage() {
  const { user } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const { formatDateTime } = useFormatDate();

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && user) {
      loadLogs();
    }
  }, [user, authLoading, page]);

  const loadLogs = async () => {
    try {
      const data = await auditService.getAuditLogs(page, 20);
      setLogs(data.data || data);
    } catch (error) {
      toast.error('Gagal memuat audit log');
    } finally {
      setIsLoading(false);
    }
  };

  const actionLabels: Record<string, string> = {
    CREATE: 'Buat',
    UPDATE: 'Update',
    DELETE: 'Hapus',
    SUBMIT_PROGRESS: 'Submit Progress',
    VERIFY_APPROVE: 'Approve Verifikasi',
    VERIFY_REJECT: 'Reject Verifikasi',
    PAYMENT_CONFIRM: 'Konfirmasi Bayar',
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <>
      <Head>
        <title>Audit Log - AMANTRA</title>
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Audit Trail</h1>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Entity</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.user?.name || 'System'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.entityType} ({log.entityId?.slice(0, 8)}...)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Frontend bisa diakses http://localhost:3000
- [ ] Login berhasil dengan akun demo
- [ ] Dashboard menampilkan stats
- [ ] Dashboard menampilkan projects terbaru
- [ ] Tombol aksi cepat sesuai role
- [ ] Projects page list semua proyek
- [ ] Project detail menampilkan info & termin
- [ ] Verifications page hanya bisa diakses SUPERVISOR/WITNESS
- [ ] Payments page menampilkan list pembayaran
- [ ] Audit page menampilkan semua aksi

---

## 🔧 Commands untuk Frontend Dev

```bash
# Development
cd frontend
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

**Next Steps:**
1. Copy-paste template code ke files yang belum ada
2. Test setiap page dengan berbagai role
3. Tambahkan modal/form untuk aksi (create, edit, approve)
4. Integrate dengan file upload untuk progress photos
5. Add real-time notifications untuk verifications

