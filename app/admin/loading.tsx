export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[#E6DFD5]/60 rounded-lg"></div>
          <div className="h-4 w-72 bg-[#E6DFD5]/40 rounded-md"></div>
        </div>
        <div className="h-10 w-44 bg-[#E6DFD5]/50 rounded-lg"></div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs space-y-3">
            <div className="h-3 w-24 bg-[#E6DFD5]/50 rounded"></div>
            <div className="h-7 w-16 bg-[#E6DFD5]/70 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content Card Skeleton */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E6DFD5] bg-[#FAF8F5] flex items-center justify-between">
          <div className="h-4 w-40 bg-[#E6DFD5]/60 rounded"></div>
        </div>
        <div className="divide-y divide-[#E6DFD5]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-64 bg-[#E6DFD5]/70 rounded"></div>
                <div className="h-3 w-96 bg-[#E6DFD5]/40 rounded"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-[#E6DFD5]/50 rounded-lg"></div>
                <div className="h-8 w-20 bg-[#E6DFD5]/50 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
