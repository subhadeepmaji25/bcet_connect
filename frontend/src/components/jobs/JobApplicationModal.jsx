import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Zap, Info } from "lucide-react";
import toast from "react-hot-toast";
import { getResumes } from "../../api/users.api";

export default function JobApplicationModal({ isOpen, onClose, job, onConfirm }) {
  const { data: resData, isPending } = useQuery({ queryKey: ["my-resumes"], queryFn: getResumes, enabled: isOpen });
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Filter out soft-deleted resumes
  const resumes = (resData?.data?.resumes || resData?.data || []).filter(r => !r.isDeleted);

  const actualSelectedId = selectedResumeId || (resumes.length > 0 ? (resumes.find(r => r.isDefault) || resumes[0])._id : "");

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!actualSelectedId) {
      toast.error("Please select a resume");
      return;
    }
    setIsApplying(true);
    await onConfirm(job._id, actualSelectedId, coverLetter);
    setIsApplying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900">Apply to {job?.company}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">✕</button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <h4 className="font-semibold text-slate-800 mb-2">{job?.title}</h4>
          
          {job?.metadata?.eligibilityCriteria && (
            <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-800">Eligibility Criteria</p>
                <p className="text-xs text-blue-700 mt-1">{job.metadata.eligibilityCriteria}</p>
              </div>
            </div>
          )}

          <p className="text-sm font-semibold text-slate-700 mb-3">1. Select Resume</p>
          
          {isPending ? (
            <div className="h-20 bg-slate-100 animate-pulse rounded-xl mb-6" />
          ) : resumes.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center mb-6">
              <p className="text-sm text-amber-700 font-medium mb-3">You don't have any active resumes.</p>
              <Link to="/profile" className="px-4 py-2 bg-white border border-amber-200 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors inline-block">
                Upload Resume in Profile
              </Link>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {resumes.map(res => (
                <label key={res._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${actualSelectedId === res._id ? 'border-[#635BFF] bg-[#635BFF]/5 shadow-[0_0_0_1px_#635BFF]' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="resume" value={res._id} checked={actualSelectedId === res._id} onChange={(e) => setSelectedResumeId(e.target.value)} className="w-4 h-4 text-[#635BFF] border-slate-300 focus:ring-[#635BFF]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{res.fileName || res.originalName || 'Resume.pdf'}</p>
                    <div className="flex gap-2 items-center mt-0.5">
                      <span className="text-[10px] text-slate-500">Uploaded {new Date(res.createdAt).toLocaleDateString()}</span>
                      {res.isDefault && <span className="text-[9px] font-bold bg-[#16A34A]/10 text-[#16A34A] px-1.5 py-0.5 rounded border border-[#16A34A]/20">Default</span>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <p className="text-sm font-semibold text-slate-700 mb-3">2. Cover Letter (Optional)</p>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Write a brief note explaining why you're a good fit..."
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] outline-none resize-none custom-scrollbar"
          ></textarea>
        </div>
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleApply} disabled={isApplying || resumes.length === 0 || !actualSelectedId} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#524be3] shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] rounded-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
            {isApplying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
            Submit Application
          </button>
        </div>
      </motion.div>
    </div>
  );
}
