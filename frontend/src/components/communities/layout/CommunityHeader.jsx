import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ClockIcon, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { joinCommunity, leaveCommunity, createJoinRequest } from "../../../api/community.api";

export default function CommunityHeader({ community, membership, role, isMember, communityId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const joinMut = useMutation({
    mutationFn: () => joinCommunity(communityId),
    onSuccess: () => {
      toast.success("Joined community!");
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to join");
    }
  });

  const requestMut = useMutation({
    mutationFn: () => createJoinRequest(communityId, {}),
    onSuccess: () => {
      toast.success("Join request sent! Wait for leader approval.");
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send request");
    }
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveCommunity(communityId),
    onSuccess: () => {
      toast.success("Left community");
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
      navigate("/communities");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to leave");
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
      <div className="h-32 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 relative">
        {community.coverImage && (
          <img src={community.coverImage} alt="cover" className="w-full h-full object-cover" />
        )}
      </div>
      
      <div className="px-6 pb-6 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 -mt-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-md p-1.5 shrink-0 flex items-center justify-center">
            {community.avatar ? (
              <img src={community.avatar} alt="avatar" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Users className="w-10 h-10 text-indigo-600" />
            )}
          </div>
          
          <div className="pt-2 md:pt-0">
            <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
              <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">{community.name}</h1>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                {community.category}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                community.visibility === "public"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
                {community.visibility}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-bold mt-1.5 flex items-center justify-center md:justify-start gap-2">
              <span>{community.memberCount || 1} Member{ (community.memberCount || 1) !== 1 ? 's' : '' }</span>
              {isMember && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 font-extrabold capitalize">Role: {role}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-center md:justify-end gap-3 shrink-0">
          {isMember ? (
            <button
              onClick={() => { if (window.confirm("Leave this community?")) leaveMut.mutate(); }}
              disabled={leaveMut.isPending}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Leave
            </button>
          ) : community.visibility === "private" ? (
            <button
              onClick={() => requestMut.mutate()}
              disabled={requestMut.isPending}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-2"
            >
              <ClockIcon className="w-3.5 h-3.5" />
              {requestMut.isPending ? "Sending..." : "Request to Join"}
            </button>
          ) : (
            <button
              onClick={() => joinMut.mutate()}
              disabled={joinMut.isPending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10"
            >
              {joinMut.isPending ? "Joining..." : "Join Community"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
