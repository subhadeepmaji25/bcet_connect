import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useResourceDetail } from "../../hooks/useResources";
import { ResourceDetailViewer } from "../../components/resource/ResourceDetailViewer";

export const ResourceDetailPage = () => {
  const { id } = useParams();
  const { data: resourceData, isLoading, isError } = useResourceDetail(id);

  const resource = resourceData?.data?.resource;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isError || !resource) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">Resource Not Found</h2>
          <p>The resource you are looking for does not exist or you don't have permission to view it.</p>
          <Link to="/learning/resources" className="inline-block mt-4 text-indigo-400 hover:text-indigo-300">
            &larr; Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Link to="/learning/resources" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={18} />
        Back to Resources
      </Link>
      
      <ResourceDetailViewer resource={resource} />

      {/* Placeholder for discussions below the resource */}
      <div className="mt-12 bg-[#1a1a2e] border border-white/5 rounded-xl p-6 lg:p-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <MessageSquare className="text-indigo-400" />
          Discussions & Questions
        </h2>
        <div className="text-center py-12 text-slate-400 bg-[#0f0f1a] rounded-lg border border-white/5">
          <p>Discussion thread for this resource is currently empty.</p>
          <button className="mt-4 px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/30 transition-colors">
            Ask a Question
          </button>
        </div>
      </div>
    </div>
  );
};
