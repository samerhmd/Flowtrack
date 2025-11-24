export default function FlowRecipeLoading() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
              <div className="flex gap-2 ml-4">
                <div className="h-4 bg-gray-200 rounded w-8" />
                <div className="h-4 bg-gray-200 rounded w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}