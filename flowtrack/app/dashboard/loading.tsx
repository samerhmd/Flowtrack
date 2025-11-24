export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-16 mt-4" />
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm md:col-span-2 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16 mt-4" />
        </div>
      </div>
    </div>
  );
}