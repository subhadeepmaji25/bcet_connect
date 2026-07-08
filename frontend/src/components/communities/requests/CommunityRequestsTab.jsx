import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Users, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { getPendingJoinRequests, approveJoinRequest, rejectJoinRequest } from "../../../api/community.api";
import Avatar from "../../ui/Avatar";

export default function CommunityRequestsTab({ communityId }) {
  const queryClient = useQueryClient();

  const { data: requestsData, isPending } = useQuery({
    queryKey: ["community-requests", communityId],
    queryFn: () => getPendingJoinRequests(communityId)
  });

  const approveMut = useMutation({
    mutationFn: approveJoinRequest,
    onSuccess: () => {
      toast.success("Request approved!");
      queryClient.invalidateQueries({ queryKey: ['community-requests', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to approve");
    }
  });

  const rejectMut = useMutation({
    mutationFn: (requestId) => rejectJoinRequest(requestId),
    onSuccess: () => {
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ['community-requests', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reject");
    }
  });

  const requests = requestsData?.data?.requests || requestsData?.data || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
        <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
          <Users className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="font-display font-black text-slate-900 text-lg leading-none">Join Requests</h3>
          {requests.length > 0 && (
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{requests.length} pending</p>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="py-10 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No pending join requests.</p>
          <p className="text-xs text-slate-400 mt-1">New requests from private community applicants will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            // After backend populate, req is already a flattened object with id, username, email, message, etc.
            const requesterName = req.username || "Unknown User";
            const requesterUsername = req.username || "";
            const requesterAvatar = ""; // API doesn't return avatar currently
            return (
              <div key={req.requestId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar src={requesterAvatar} name={requesterName} size="md" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{requesterName}</p>
                    {requesterUsername && (
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">@{requesterUsername}</p>
                    )}
                    {req.message && (
                      <p className="text-xs text-slate-500 font-medium mt-1 italic max-w-xs line-clamp-1">"{req.message}"</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Requested {new Date(req.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approveMut.mutate(req.requestId)}
                    disabled={approveMut.isPending}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => rejectMut.mutate(req.requestId)}
                    disabled={rejectMut.isPending}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
