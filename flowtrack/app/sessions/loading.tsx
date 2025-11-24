export default function SessionsLoading() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between items-center">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}