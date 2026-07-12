import { CheckCircle2, Clock, XCircle, Archive } from "lucide-react";

export const StatusBadge = ({ status }) => {
  const configs = {
    published: { color: "text-green-400 bg-green-400/10 border-green-400/20", icon: CheckCircle2 },
    pending: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Clock },
    rejected: { color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
    archived: { color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: Archive },
  };

  const config = configs[status?.toLowerCase()] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon size={12} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
