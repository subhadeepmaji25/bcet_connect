import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Clock, Award, Play } from "lucide-react";
import { usePathDetail } from "../../hooks/useLearningPaths";
import { useAuth } from "../../../../hooks/useAuth";
import { typeConfig } from "../../components/resource/ResourceCard";

export const PathDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: pathData, isLoading, isError } = usePathDetail(id);

  const path = pathData?.data?.path;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (isError || !path) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">Path Not Found</h2>
          <p>The learning path you are looking for does not exist.</p>
          <Link to="/learning/paths" className="inline-block mt-4 text-sky-400 hover:text-sky-300">
            &larr; Back to Paths
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Progress (mocked based on array if progress data is merged from backend, otherwise we'd need another hook)
  // Assuming the backend populates `isCompleted` on nodes if the user has completed them.
  const nodes = path.nodes || [];
  const completedNodesCount = nodes.filter(n => n.isCompleted).length;
  const progressPercent = nodes.length > 0 ? Math.round((completedNodesCount / nodes.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Link to="/learning/paths" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={18} />
        Back to Learning Paths
      </Link>
      
      {/* Path Header */}
      <div className="bg-gradient-to-br from-sky-900/30 to-[#1a1a2e] border border-sky-500/20 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-sky-500/20 text-sky-400 text-xs px-2.5 py-1 rounded-full uppercase tracking-wide font-semibold">
              {path.difficulty || "All Levels"}
            </span>
            {path.subjectId && (
              <span className="bg-white/5 text-slate-300 text-xs px-2.5 py-1 rounded border border-white/10">
                {path.subjectId.code}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{path.title}</h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl">{path.description}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-indigo-400" />
              <span>{path.estimatedTimeMinutes ? `${path.estimatedTimeMinutes} mins` : "Self-paced"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={18} className="text-yellow-400" />
              <span>{nodes.length} Items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar (Student View) */}
      {user?.role === 'student' && (
        <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-semibold text-white">Your Progress</h3>
            <span className="text-sky-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#0f0f1a] rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-sky-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-400 text-right">
            {completedNodesCount} of {nodes.length} completed
          </p>
        </div>
      )}

      {/* Nodes Timeline */}
      <div className="relative pl-4 md:pl-8 py-4">
        {/* Vertical Line */}
        <div className="absolute top-0 bottom-0 left-[23px] md:left-[39px] w-0.5 bg-white/10"></div>
        
        <div className="space-y-8">
          {nodes.map((node, index) => {
            const isResource = !!node.resourceId;
            const resource = node.resourceId || {};
            const isCompleted = node.isCompleted;
            const isLocked = !isCompleted && index > 0 && !nodes[index - 1].isCompleted; // Simple unlock logic if enforced
            
            // Just basic UI mapping, assuming standard types if it's a resource
            const rType = resource.type || "document";
            // In a real app we'd reuse the typeConfig from ResourceCard, but here we can just do basic icons
            
            return (
              <div key={node._id} className="relative z-10 flex gap-6">
                <div className="flex-shrink-0 mt-1.5 relative">
                  {isCompleted ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-[#0f0f1a]">
                      <CheckCircle2 size={24} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1a1a2e] text-slate-400 flex items-center justify-center border-2 border-white/20">
                      <Circle size={20} />
                    </div>
                  )}
                </div>
                
                <div className={`flex-1 bg-[#1a1a2e] border ${isCompleted ? 'border-emerald-500/30' : 'border-white/5'} hover:border-sky-500/30 transition-all rounded-xl p-5 ${isLocked ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Step {index + 1}</span>
                    {isResource && (
                      <span className="bg-white/5 text-slate-300 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                        {rType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 ${isCompleted ? 'text-white' : 'text-slate-200'}`}>
                    {node.title || resource.title || "Untitled Step"}
                  </h3>
                  
                  {node.description && (
                    <p className="text-sm text-slate-400 mb-4">{node.description}</p>
                  )}
                  
                  {isResource && (
                    <Link 
                      to={`/learning/resources/${resource._id}`}
                      className={`inline-flex items-center gap-2 text-sm font-medium ${isLocked ? 'pointer-events-none text-slate-500' : 'text-sky-400 hover:text-sky-300'}`}
                    >
                      <Play size={16} />
                      {isCompleted ? "Review Resource" : "Start Resource"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
