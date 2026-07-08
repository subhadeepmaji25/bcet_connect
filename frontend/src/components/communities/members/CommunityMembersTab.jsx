import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, VolumeX, UserMinus, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { getMembers, muteMember, unmuteMember, removeMember, changeMemberRole, banMember, unbanMember } from "../../../api/community.api";
import { useAuth } from "../../../hooks/useAuth";
import { useDebounce } from "../../../hooks/useDebounce";
import Avatar from "../../ui/Avatar";

export default function CommunityMembersTab({ communityId, role }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const debouncedSearch = useDebounce(searchVal, 400);

  const { data: membersData, isPending } = useQuery({
    queryKey: ["community-members", communityId, debouncedSearch],
    queryFn: () => getMembers(communityId, { q: debouncedSearch })
  });

  const muteMut = useMutation({
    mutationFn: ({ userId, mute }) => {
      if (mute) {
        // Mute for 7 days
        const mutedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        return muteMember(communityId, userId, { mutedUntil });
      } else {
        return unmuteMember(communityId, userId);
      }
    },
    onSuccess: () => {
      toast.success("Member mute status updated");
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Action failed");
    }
  });

  const removeMut = useMutation({
    mutationFn: (userId) => removeMember(communityId, userId),
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Action failed");
    }
  });

  const roleMut = useMutation({
    mutationFn: ({ userId, newRole }) => changeMemberRole(communityId, userId, { newRole }),
    onSuccess: () => {
      toast.success("Member role updated");
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update role");
    }
  });

  const banMut = useMutation({
    mutationFn: ({ userId, ban, reason }) => {
      if (ban) {
        return banMember(communityId, userId, { reason });
      } else {
        return unbanMember(communityId, userId);
      }
    },
    onSuccess: () => {
      toast.success("Member ban status updated");
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Action failed");
    }
  });

  const members = membersData?.data?.members || membersData?.data || [];
  const isLeader = ["owner", "leader", "co-leader"].includes(role);

  return (
    <div className="space-y-4">
      {/* Search Members */}
      <div className="relative group max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search members by name..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-400 focus:bg-white outline-none transition-all"
        />
      </div>

      {isPending ? (
        <div className="h-10 skeleton animate-pulse rounded-xl" />
      ) : members.length === 0 ? (
        <p className="text-xs text-slate-500 font-semibold p-4">No members found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const isSelf = member.id === currentUser?.userId;
            const canManage = isLeader && !isSelf && (role === "owner" || member.communityRole !== "owner");
            
            return (
              <div key={member.membershipId} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar src={member.avatar || ""} name={member.username || "?"} size="md" />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-800">{member.username}</p>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        member.communityRole === "owner" ? "bg-red-50 text-red-600 border border-red-200" :
                        member.communityRole === "leader" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" :
                        member.communityRole === "co-leader" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                        member.communityRole === "moderator" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                        "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        {member.communityRole}
                      </span>
                      {member.isMuted && (
                        <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <VolumeX className="w-2.5 h-2.5" /> Muted
                        </span>
                      )}
                      {member.isBanned && (
                        <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                          <Ban className="w-2.5 h-2.5" /> Banned
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">@{member.username}</p>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => muteMut.mutate({ userId: member.id, mute: !member.isMuted })}
                      disabled={muteMut.isPending}
                      title={member.isMuted ? "Unmute member" : "Mute member"}
                      className={`p-2 rounded-xl border transition-all hover:shadow-sm ${
                        member.isMuted
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                          : "bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100"
                      }`}
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>

                    <select
                      value={member.communityRole}
                      onChange={(e) => roleMut.mutate({ userId: member.id, newRole: e.target.value })}
                      className="bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl p-1.5 text-[11px] font-bold text-slate-700 outline-none transition-colors cursor-pointer"
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                      {role === "owner" && <option value="co-leader">Co-Leader</option>}
                      {role === "owner" && <option value="leader">Leader</option>}
                    </select>

                    <button
                      onClick={() => {
                        if (!member.isBanned) {
                          const reason = window.prompt("Reason for banning this member?");
                          if (reason !== null) banMut.mutate({ userId: member.id, ban: true, reason });
                        } else {
                          if (window.confirm("Unban this member?")) banMut.mutate({ userId: member.id, ban: false });
                        }
                      }}
                      disabled={banMut.isPending}
                      title={member.isBanned ? "Unban member" : "Ban member"}
                      className={`p-2 rounded-xl border transition-all hover:shadow-sm ${
                        member.isBanned
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                          : "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => { if (window.confirm("Remove member?")) removeMut.mutate(member.id); }}
                      disabled={removeMut.isPending}
                      title="Remove member"
                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all hover:shadow-sm"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
