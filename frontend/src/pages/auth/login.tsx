import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';

const translations = {
  id: {
    title: 'Masuk ke AMANTRA',
    email: 'Email',
    password: 'Password',
    loginButton: 'Masuk',
    forgotPassword: 'Lupa password?',
    noAccount: 'Belum punya akun?',
    register: 'Daftar sekarang',
    error: 'Email atau password salah',
    success: 'Login berhasil',
  },
  en: {
    title: 'Login to AMANTRA',
    email: 'Email',
    password: 'Password',
    loginButton: 'Login',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    register: 'Register now',
    error: 'Invalid email or password',
    success: 'Login successful',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { locale } = router;
  const t = translations[locale as keyof typeof translations] || translations.id;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.error);
      }

      // Store token
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(t.success);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t.title} | AMANTRA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-12 h-12 bg-amantra-gold rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">A</span>
              </div>
              <span className="text-white font-bold text-2xl">AMANTRA</span>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
              {t.title}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="label">
                  {t.email}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  {t.password}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
                  {t.forgotPassword}
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  t.loginButton
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              {t.noAccount}{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-500 font-medium">
                {t.register}
              </Link>
            </p>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-2">Demo accounts (Password: Password123!)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'owner@amantra.id', password: 'Password123!' })}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'kontraktor@amantra.id', password: 'Password123!' })}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Contractor
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'pengawas@amantra.id', password: 'Password123!' })}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'saksi@amantra.id', password: 'Password123!' })}
                  className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Saksi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
