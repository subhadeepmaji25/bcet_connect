import { Link } from "react-router-dom";
import { FileText, Play, Link as LinkIcon, Code, Presentation, Star, Clock, Download, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { VisibilityBadge } from "./VisibilityBadge";

export const typeConfig = {
  document: { icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10" },
  video: { icon: Play, color: "text-red-400", bg: "bg-red-400/10" },
  link: { icon: LinkIcon, color: "text-green-400", bg: "bg-green-400/10" },
  video_link: { icon: Play, color: "text-red-400", bg: "bg-red-400/10" },
  reference_link: { icon: LinkIcon, color: "text-green-400", bg: "bg-green-400/10" },
  code_snippet: { icon: Code, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  presentation: { icon: Presentation, color: "text-purple-400", bg: "bg-purple-400/10" },
};

export const ResourceCard = ({ resource, showStatus = false, showSubject = false }) => {
  if (!resource) return null;
  const config = typeConfig[resource.type] || typeConfig.document;
  const Icon = config.icon;

  return (
    <div className="bg-[#1a1a2e] border border-white/5 hover:border-indigo-500/30 transition-all duration-300 rounded-xl overflow-hidden group hover:shadow-xl hover:-translate-y-1">
      <Link to={`/learning/resources/${resource._id}`} className="block p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${config.bg} ${config.color}`}>
            <Icon size={24} />
          </div>
          <div className="flex flex-col items-end gap-2">
            {showStatus && <StatusBadge status={resource.status} />}
            <VisibilityBadge visibility={resource.visibility} section={resource.section} />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
          {resource.title}
        </h3>
        
        <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">
          {resource.description || "No description provided."}
        </p>

        {showSubject && resource.subjectId && (
          <div className="mb-4 text-xs font-medium bg-white/5 text-slate-300 px-2 py-1 rounded w-fit">
            {resource.subjectId.name} ({resource.subjectId.code})
          </div>
        )}

        <div className="flex items-center justify-between text-slate-400 text-xs mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star size={14} className={resource.metrics?.avgRating > 0 ? "text-yellow-400" : ""} />
              {resource.metrics?.avgRating?.toFixed(1) || "New"}
            </span>
            <span className="flex items-center gap-1">
              <Download size={14} />
              {resource.metrics?.downloads || 0}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {resource.estimatedTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {resource.estimatedTimeMinutes}m
              </span>
            )}
            <span className="capitalize text-slate-500">
              {resource.difficulty}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
