import type { User, Environment } from '@nclex311/types';
import Link from 'next/link';

export default function Home() {
  // Test workspace dependency resolution
  const testUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  };
  const env: Environment = 'development';

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-sans sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-8">
        <h1 className="text-center text-4xl font-bold">
          NCLEX 311 Web Application
        </h1>

        <div className="max-w-2xl space-y-4 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Foundation setup complete! Next.js + TypeScript monorepo is ready
            for development.
          </p>

          <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <h2 className="mb-2 font-semibold">Workspace Test</h2>
            <p className="text-sm">
              User: {testUser.name} ({testUser.email})<br />
              Environment: {env}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="rounded bg-green-50 p-4 dark:bg-green-900">
              <h3 className="font-medium text-green-800 dark:text-green-200">
                ✓ Completed
              </h3>
              <ul className="mt-2 space-y-1 text-green-700 dark:text-green-300">
                <li>• Git repository initialized</li>
                <li>• Next.js 15.x with TypeScript</li>
                <li>• Monorepo structure (apps/, packages/)</li>
                <li>• Workspace dependencies</li>
                <li>• Tailwind CSS configured</li>
              </ul>
            </div>

            <div className="rounded bg-blue-50 p-4 dark:bg-blue-900">
              <h3 className="font-medium text-blue-800 dark:text-blue-200">
                ⚡ Ready For
              </h3>
              <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Feature development</li>
                <li>• UI component creation</li>
                <li>• API route implementation</li>
                <li>• Database integration</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/auth-demo"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              🔐 Try Authentication Demo
            </Link>
          </div>
        </div>
      </main>

      <footer className="row-start-3 text-center text-sm text-gray-500">
        NCLEX 311 - Repository Setup Complete
      </footer>
    </div>
  );
}
