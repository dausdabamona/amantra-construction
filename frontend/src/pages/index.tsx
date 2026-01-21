import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Translations
const translations = {
  id: {
    title: 'AMANTRA Construction',
    subtitle: 'Sistem Manajemen Kontrak Konstruksi',
    description:
      'Platform B2B untuk manajemen kontrak konstruksi berbasis termin dengan verifikasi berlapis dan audit trail lengkap.',
    features: [
      {
        title: 'Kontrak Berbasis Termin',
        description: 'Pembayaran bertahap berdasarkan milestone pekerjaan yang terukur.',
      },
      {
        title: 'Verifikasi Berlapis',
        description: 'Setiap progres diverifikasi oleh pengawas dan saksi ahli.',
      },
      {
        title: 'Audit Trail Lengkap',
        description: 'Semua aktivitas tercatat dengan bukti digital yang tidak dapat dimanipulasi.',
      },
      {
        title: 'Siap Web3',
        description: 'Arsitektur yang siap terhubung dengan smart contract AmantraLedger.',
      },
    ],
    loginButton: 'Masuk',
    registerButton: 'Daftar',
    roles: {
      title: 'Untuk Semua Stakeholder',
      owner: 'Pemberi Kerja',
      contractor: 'Kontraktor',
      supervisor: 'Pengawas',
      witness: 'Saksi Ahli',
    },
  },
  en: {
    title: 'AMANTRA Construction',
    subtitle: 'Construction Contract Management System',
    description:
      'B2B platform for term-based construction contract management with multi-layer verification and complete audit trail.',
    features: [
      {
        title: 'Term-Based Contracts',
        description: 'Phased payments based on measurable work milestones.',
      },
      {
        title: 'Multi-Layer Verification',
        description: 'Each progress verified by supervisors and expert witnesses.',
      },
      {
        title: 'Complete Audit Trail',
        description: 'All activities recorded with tamper-proof digital evidence.',
      },
      {
        title: 'Web3 Ready',
        description: 'Architecture ready to integrate with AmantraLedger smart contract.',
      },
    ],
    loginButton: 'Login',
    registerButton: 'Register',
    roles: {
      title: 'For All Stakeholders',
      owner: 'Project Owner',
      contractor: 'Contractor',
      supervisor: 'Supervisor',
      witness: 'Expert Witness',
    },
  },
};

export default function Home() {
  const router = useRouter();
  const { locale } = router;
  const t = translations[locale as keyof typeof translations] || translations.id;

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
        {/* Header */}
        <header className="border-b border-white/10">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-amantra-gold rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-white font-bold text-xl">AMANTRA</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <select
                value={locale}
                onChange={(e) => router.push(router.pathname, router.asPath, { locale: e.target.value })}
                className="bg-white/10 text-white border border-white/20 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="id">🇮🇩 ID</option>
                <option value="en">🇺🇸 EN</option>
              </select>

              <Link href="/auth/login" className="text-white/80 hover:text-white transition-colors">
                {t.loginButton}
              </Link>
              <Link
                href="/auth/register"
                className="bg-amantra-gold text-white px-4 py-2 rounded-md font-medium hover:bg-amantra-gold/90 transition-colors"
              >
                {t.registerButton}
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              {t.title}
            </h1>
            <p className="text-xl sm:text-2xl text-primary-200 mb-4">
              {t.subtitle}
            </p>
            <p className="text-lg text-primary-300 max-w-3xl mx-auto mb-12">
              {t.description}
            </p>

            <div className="flex justify-center space-x-4">
              <Link
                href="/auth/register"
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                {t.registerButton}
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                {t.loginButton}
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              >
                <div className="w-12 h-12 bg-amantra-gold/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-amantra-gold text-2xl">
                    {['📋', '✅', '📊', '🔗'][index]}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-primary-300 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Roles */}
          <div className="mt-24 text-center">
            <h2 className="text-2xl font-bold text-white mb-8">{t.roles.title}</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[t.roles.owner, t.roles.contractor, t.roles.supervisor, t.roles.witness].map(
                (role, index) => (
                  <span
                    key={index}
                    className="px-6 py-3 bg-white/10 text-white rounded-full border border-white/20"
                  >
                    {role}
                  </span>
                )
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-primary-300">
            <p>&copy; 2024 AMANTRA Construction. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
