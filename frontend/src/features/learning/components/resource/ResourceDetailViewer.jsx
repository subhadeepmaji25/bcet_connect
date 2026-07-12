import { useEffect } from "react";
import { format } from "date-fns";
import { Download, ExternalLink, Calendar, User, Eye } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { VisibilityBadge } from "./VisibilityBadge";
import { BookmarkButton } from "./BookmarkButton";
import { RatingStars } from "./RatingStars";
import { useMarkOpened as useMarkOpenedProgress } from "../../hooks/useLearningProgress";
import { useTrackDownload as useTrackDownloadEngagement } from "../../hooks/useResourceEngagement";

export const ResourceDetailViewer = ({ resource }) => {
  const { mutate: markOpened } = useMarkOpenedProgress();
  const { mutate: trackDownload } = useTrackDownloadEngagement();

  // Mark as opened when mounted
  useEffect(() => {
    if (resource?._id) {
      markOpened(resource._id);
    }
  }, [resource?._id, markOpened]);

  if (!resource) return null;

  const isLink = ["video_link", "reference_link"].includes(resource.type);

  const handleAction = () => {
    if (!isLink) {
      trackDownload(resource._id);
    }
  };

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 lg:p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <StatusBadge status={resource.status} />
            <VisibilityBadge visibility={resource.visibility} section={resource.section} />
            <span className="bg-white/5 text-indigo-300 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wide">
              {resource.type.replace("_", " ")}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{resource.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <User size={16} />
              {resource.uploader?.name || "Unknown Uploader"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={16} />
              {format(new Date(resource.createdAt), "MMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={16} />
              {resource.metrics?.views || 0} views
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <BookmarkButton resourceId={resource._id} initialStatus={false} />
          
          <a
            href={isLink ? resource.externalUrl : resource.file?.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAction}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all"
          >
            {isLink ? <ExternalLink size={18} /> : <Download size={18} />}
            {isLink ? "Open Link" : "Download File"}
          </a>
        </div>
      </div>

      <div className="prose prose-invert max-w-none mb-8">
        <p className="text-slate-300 leading-relaxed text-lg">
          {resource.description || "No description provided."}
        </p>
      </div>

      {resource.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {resource.tags.map(tag => (
            <span key={tag} className="bg-[#0f0f1a] text-slate-300 border border-white/10 px-3 py-1 rounded-md text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-white/10 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rate this resource</h3>
        <RatingStars resourceId={resource._id} />
      </div>
    </div>
  );
};
