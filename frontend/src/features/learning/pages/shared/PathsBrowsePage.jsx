import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Map, Users, Clock, Search, ChevronRight } from "lucide-react";
import { usePathList } from "../../hooks/useLearningPaths";

export const PathsBrowsePage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const { data: pathsData, isLoading } = usePathList({
    page,
    limit: 12,
    search: search || undefined
  });

  const paths = pathsData?.data?.paths || [];
  const pagination = pathsData?.data?.pagination;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <GraduationCap className="text-sky-400" />
          Learning Paths
        </h1>
        <p className="text-slate-400">Curated sequences of resources to master specific topics.</p>
      </div>

      <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-4 md:p-6 mb-8 flex shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search paths by title or tags..."
            className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-sky-500 transition-colors"
          />
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : paths.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a2e] border border-white/5 rounded-xl">
          <Map size={48} className="mx-auto text-slate-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No paths found</h3>
          <p className="text-slate-400">Try adjusting your search terms or wait for faculty to create new paths.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map(path => (
              <div key={path._id} className="bg-[#1a1a2e] border border-white/5 hover:border-sky-500/30 transition-all duration-300 rounded-xl overflow-hidden group hover:shadow-xl hover:-translate-y-1">
                <Link to={`/learning/paths/${path._id}`} className="block p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-sky-400/10 text-sky-400">
                      <Map size={24} />
                    </div>
                    <span className="bg-white/5 text-slate-300 text-xs px-2.5 py-1 rounded border border-white/10">
                      {path.difficulty || "All Levels"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
                    {path.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">
                    {path.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between text-slate-400 text-sm mt-auto pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Clock size={16} />
                      {path.estimatedTimeMinutes ? `${path.estimatedTimeMinutes}m` : "Self-paced"}
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                      View Path <ChevronRight size={16} />
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2.5 bg-[#1a1a2e] border border-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-[#0f0f1a] transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400 font-medium px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-5 py-2.5 bg-[#1a1a2e] border border-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-[#0f0f1a] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
