'use client';

export default function SessionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-3 max-w-md mx-auto mt-8">
      <h2 className="text-lg font-semibold text-red-600">
        Sessions error
      </h2>
      <p className="text-sm text-gray-600">
        {error.message || 'An unexpected error occurred while loading your sessions.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}