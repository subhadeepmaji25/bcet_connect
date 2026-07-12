import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { usePendingResources } from "../../hooks/useResources";
import { VerificationQueueRow } from "../../components/resource/VerificationQueueRow";

export const PendingVerificationPage = () => {
  const { data: queueData, isLoading, isError } = usePendingResources();
  const resources = queueData?.data?.resources || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ShieldAlert className="text-emerald-400" />
          Pending Verification
        </h1>
        <p className="text-slate-400">Review and approve resources uploaded by students and alumni.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl">
          Failed to load pending resources. You might not have permission.
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a2e] border border-white/5 rounded-xl">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500/50 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-400">There are no pending resources waiting for verification.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map(resource => (
            <VerificationQueueRow key={resource._id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
};
