import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Check, X, FileText, Play, Link as LinkIcon, Code, Presentation } from "lucide-react";
import { useVerifyResource } from "../../hooks/useResources";

const typeConfig = {
  document: { icon: FileText, color: "text-blue-400" },
  video: { icon: Play, color: "text-red-400" },
  link: { icon: LinkIcon, color: "text-green-400" },
  video_link: { icon: Play, color: "text-red-400" },
  reference_link: { icon: LinkIcon, color: "text-green-400" },
  code_snippet: { icon: Code, color: "text-yellow-400" },
  presentation: { icon: Presentation, color: "text-purple-400" },
};

export const VerificationQueueRow = ({ resource }) => {
  const { mutate: verifyResource, isPending } = useVerifyResource();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = () => {
    verifyResource({ id: resource._id, decision: "verified" });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    verifyResource({ id: resource._id, decision: "rejected", rejectionReason });
    setIsRejecting(false);
  };

  const Icon = typeConfig[resource.type]?.icon || FileText;
  const iconColor = typeConfig[resource.type]?.color || "text-blue-400";

  return (
    <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 md:items-center justify-between transition-all hover:border-white/10">
      <div className="flex items-start gap-4 flex-1">
        <div className={`p-3 bg-[#0f0f1a] rounded-xl border border-white/5 ${iconColor}`}>
          <Icon size={24} />
        </div>
        
        <div className="flex-1">
          <Link to={`/learning/resources/${resource._id}`} className="text-lg font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
            {resource.title}
          </Link>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
            <span>By: <span className="text-slate-300">{resource.uploader?.name || "Unknown"}</span></span>
            <span>Subject: <span className="text-indigo-300">{resource.subjectId?.code || "N/A"}</span></span>
            <span>Date: {format(new Date(resource.createdAt), "MMM dd")}</span>
            <span className="uppercase text-xs tracking-wider bg-white/5 px-2 py-0.5 rounded text-slate-300">
              {resource.visibility}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {isRejecting ? (
          <div className="flex items-center gap-2 w-full md:w-64">
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason (min 5 chars)..."
              className="flex-1 bg-[#0f0f1a] border border-red-500/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
              autoFocus
            />
            <button
              onClick={handleReject}
              disabled={isPending || rejectionReason.length < 5}
              className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => setIsRejecting(false)}
              disabled={isPending}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsRejecting(true)}
              disabled={isPending}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <X size={16} />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Check size={16} />
              Approve
            </button>
          </>
        )}
      </div>
    </div>
  );
};
