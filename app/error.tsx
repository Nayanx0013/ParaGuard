"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service like Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-full mb-6 text-red-500">
        <AlertCircle size={48} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Something went wrong!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
        We encountered an unexpected error while trying to process your request. Our team has been notified.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <RotateCcw size={18} />
          Try again
        </button>
        <Link 
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors border border-gray-200 dark:border-gray-700"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
