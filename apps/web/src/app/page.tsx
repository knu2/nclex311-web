import type { User, Environment } from "@nclex311/types";

export default function Home() {
  // Test workspace dependency resolution
  const testUser: User = {
    id: "1",
    name: "Test User", 
    email: "test@example.com"
  };
  const env: Environment = "development";
  
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-4xl font-bold text-center">
          NCLEX 311 Web Application
        </h1>
        
        <div className="max-w-2xl text-center space-y-4">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Foundation setup complete! Next.js + TypeScript monorepo is ready for development.
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Workspace Test</h2>
            <p className="text-sm">
              User: {testUser.name} ({testUser.email})<br/>
              Environment: {env}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
              <h3 className="font-medium text-green-800 dark:text-green-200">✓ Completed</h3>
              <ul className="mt-2 space-y-1 text-green-700 dark:text-green-300">
                <li>• Git repository initialized</li>
                <li>• Next.js 15.x with TypeScript</li>
                <li>• Monorepo structure (apps/, packages/)</li>
                <li>• Workspace dependencies</li>
                <li>• Tailwind CSS configured</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
              <h3 className="font-medium text-blue-800 dark:text-blue-200">⚡ Ready For</h3>
              <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Feature development</li>
                <li>• UI component creation</li>
                <li>• API route implementation</li>
                <li>• Database integration</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="row-start-3 text-center text-sm text-gray-500">
        NCLEX 311 - Repository Setup Complete
      </footer>
    </div>
  );
}
