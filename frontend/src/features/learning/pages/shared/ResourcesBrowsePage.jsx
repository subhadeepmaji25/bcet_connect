import { useState } from "react";
import { Search, Filter, BookOpen } from "lucide-react";
import { useResourceList } from "../../hooks/useResources";
import { useSubjectList } from "../../hooks/useSubjects";
import { ResourceCard } from "../../components/resource/ResourceCard";

export const ResourcesBrowsePage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    subjectId: "",
    type: "",
    difficulty: ""
  });

  const { data: resourcesData, isLoading } = useResourceList({
    page,
    limit: 12,
    search: search || undefined,
    ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
  });

  const { data: subjectsData } = useSubjectList();

  const resources = resourcesData?.data?.resources || [];
  const pagination = resourcesData?.data?.pagination;
  const subjects = subjectsData?.data?.subjects || [];

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    // React Query will automatically refetch since search state is in query key
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="text-indigo-400" />
          Learning Resources
        </h1>
        <p className="text-slate-400">Discover study materials, videos, and code snippets shared by the community.</p>
      </div>

      <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-4 md:p-6 mb-8 flex flex-col md:flex-row gap-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title or tags..."
            className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </form>
        
        <div className="flex flex-col sm:flex-row gap-4 md:w-auto">
          <div className="relative">
            <select
              name="subjectId"
              value={filters.subjectId}
              onChange={handleFilterChange}
              className="w-full sm:w-48 bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.code}</option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full sm:w-40 bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">All Types</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
              <option value="code_snippet">Code</option>
              <option value="link">Links</option>
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a2e] border border-white/5 rounded-xl">
          <BookOpen size={48} className="mx-auto text-slate-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No resources found</h3>
          <p className="text-slate-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resources.map(resource => (
              <ResourceCard key={resource._id} resource={resource} showSubject={true} />
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
