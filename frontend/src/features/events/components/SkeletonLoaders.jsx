export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse flex flex-col h-full">
      {/* Banner skeleton */}
      <div className="w-full h-48 bg-slate-200" />
      
      {/* Content skeleton */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
        <div className="space-y-2 mb-4 flex-grow">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/5" />
        </div>
        <div className="pt-4 border-t border-slate-100">
          <div className="h-9 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function EventDetailsPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Banner */}
          <div className="w-full h-64 bg-slate-200" />
          
          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-slate-200 rounded" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 h-40 bg-slate-100" />
          <div className="bg-white rounded-2xl border border-slate-200 p-5 h-40 bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export function RegistrationsTableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <th key={i} className="p-4">
                  <div className="h-4 bg-slate-200 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map(row => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6].map(col => (
                  <td key={col} className="p-4">
                    <div className="h-4 bg-slate-200 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
