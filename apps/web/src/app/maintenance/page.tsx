import { Cog } from 'lucide-react';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <Cog className="w-24 h-24 text-blue-500 animate-[spin_4s_linear_infinite]" />
            <Cog className="w-12 h-12 text-blue-400 absolute bottom-0 right-0 animate-[spin_3s_linear_infinite_reverse]" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            System Maintenance
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            LedgerLens AI is currently undergoing scheduled maintenance to improve system performance and reliability.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We apologize for the inconvenience. Please try again in a few minutes.
          </p>
        </div>

        <div className="pt-8">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Check Status & Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
