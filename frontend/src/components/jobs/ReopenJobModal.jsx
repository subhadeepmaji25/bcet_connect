import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function ReopenJobModal({ isOpen, onClose, job, onConfirm, isPending }) {
  const [deadline, setDeadline] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!deadline) {
      toast.error("Please provide a new deadline");
      return;
    }
    const selectedDate = new Date(deadline);
    if (selectedDate <= new Date()) {
      toast.error("Deadline must be in the future");
      return;
    }
    onConfirm({ deadline });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Reopen Job</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">✕</button>
        </div>
        <div className="p-6">
          <h4 className="font-semibold text-slate-800 mb-2 truncate">{job?.title}</h4>
          <p className="text-sm text-slate-500 mb-6">Set a new application deadline for this job posting.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">New Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleConfirm} disabled={isPending || !deadline} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#524be3] shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] rounded-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
              {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
              Confirm Reopen
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
