import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
        <p className="text-gray-600 dark:text-gray-400">Page not found</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition font-semibold"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
