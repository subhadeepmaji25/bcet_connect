import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, LayoutGrid, FileWarning } from "lucide-react";
import { useMyUploads } from "../../hooks/useResources";
import { ResourceCard } from "../../components/resource/ResourceCard";

export const MyUploadsPage = () => {
  const [page, setPage] = useState(1);
  const { data: uploadsData, isLoading, isError } = useMyUploads({ page, limit: 12 });

  const resources = uploadsData?.data?.resources || [];
  const pagination = uploadsData?.data?.pagination;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Uploads</h1>
          <p className="text-slate-400">Manage all the resources you've shared with others.</p>
        </div>
        
        <Link
          to="/learning/resources/upload"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          Upload New
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl flex items-center gap-3">
          <FileWarning size={24} />
          <p>Failed to load your uploads. Please try again later.</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-[#0f0f1a] rounded-full mb-4">
            <LayoutGrid size={48} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No uploads yet</h3>
          <p className="text-slate-400 mb-6 max-w-md">
            You haven't uploaded any resources. Share your knowledge with the community by uploading notes, videos, or links.
          </p>
          <Link
            to="/learning/resources/upload"
            className="flex items-center gap-2 bg-[#0f0f1a] hover:bg-white/5 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/60 px-5 py-2.5 rounded-lg font-medium transition-all"
          >
            Upload your first resource
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <ResourceCard key={resource._id} resource={resource} showStatus={true} showSubject={true} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#1a1a2e] border border-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-[#0f0f1a] transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400 px-4">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-[#1a1a2e] border border-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-[#0f0f1a] transition-colors"
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
