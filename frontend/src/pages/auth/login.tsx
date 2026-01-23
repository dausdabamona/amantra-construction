import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Login berhasil!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login gagal');
    }
  };

  const quickLogin = (email: string, password: string) => {
    setFormData({ email, password });
    setErrors({});
  };

  return (
    <>
      <Head>
        <title>Login - AMANTRA Construction</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">AMANTRA</h1>
            <p className="text-blue-100">Aman dan Sejahtera dalam Setiap Termin</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Masuk</h2>
            <p className="text-gray-600 mb-6">Sistem Manajemen Kontrak Konstruksi</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="nama@email.com"
                  disabled={isLoading}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••"
                  disabled={isLoading}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Akun Demo</span>
              </div>
            </div>

            {/* Quick Login Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => quickLogin('owner@amantra.id', 'Password123!')}
                className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-2 rounded-lg transition-colors text-sm"
                disabled={isLoading}
              >
                👔 Owner (Pemberi Kerja)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('kontraktor@amantra.id', 'Password123!')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg transition-colors text-sm"
                disabled={isLoading}
              >
                🏗️ Kontraktor
              </button>
              <button
                type="button"
                onClick={() => quickLogin('pengawas@amantra.id', 'Password123!')}
                className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-2 rounded-lg transition-colors text-sm"
                disabled={isLoading}
              >
                🔍 Pengawas
              </button>
              <button
                type="button"
                onClick={() => quickLogin('saksi@amantra.id', 'Password123!')}
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 rounded-lg transition-colors text-sm"
                disabled={isLoading}
              >
                ✅ Saksi Ahli
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
              <p className="font-medium mb-1">Password Demo:</p>
              <p>
                <code className="bg-white px-2 py-1 rounded">Password123!</code>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-blue-100 text-sm">
            <p>© 2026 AMANTRA Construction. Semua hak dilindungi.</p>
          </div>
        </div>
      </div>
    </>
  );
}
