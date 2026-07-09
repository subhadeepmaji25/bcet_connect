// src/pages/communities/DiscoverCommunitiesPage.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Users, Shield, Globe, Star, ArrowRight, BookOpen } from "lucide-react";
import { listPublicCommunities, searchCommunities, joinCommunity, createJoinRequest } from "../../api/community.api";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import toast from "react-hot-toast";

// We define categories locally since importing from backend CommonJS causes Vite errors:
const ALL_CATEGORIES = [
  "technology", "career", "academic", "hobby", "sports",
  "arts", "entrepreneurship", "social-cause", "other"
];

const CATEGORY_LABELS = {
  technology: "Technology & Code",
  career: "Career & Placement",
  academic: "Academics",
  hobby: "Hobbies & Clubbing",
  sports: "Sports & Athletics",
  arts: "Arts & Culture",
  entrepreneurship: "Entrepreneurship",
  "social-cause": "Social Cause",
  other: "Other Topics"
};

export default function DiscoverCommunitiesPage() {
  const {} = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Fetch Public/All Communities list
  const { data: listData, isPending } = useQuery({
    queryKey: ["communities", debouncedSearch, selectedCategory],
    queryFn: () => {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (debouncedSearch.trim()) {
        params.q = debouncedSearch;
        return searchCommunities(params);
      }
      return listPublicCommunities(params);
    }
  });

  const joinMut = useMutation({
    mutationFn: joinCommunity,
    onSuccess: (res, communityId) => {
      toast.success("Joined community successfully!");
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      navigate(`/communities/${communityId}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to join community");
    }
  });

  const requestMut = useMutation({
    mutationFn: (communityId) => createJoinRequest(communityId, {}),
    onSuccess: () => {
      toast.success("Join request sent! Wait for leader approval.");
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send join request");
    }
  });

  const communities = listData?.data?.communities || listData?.data || [];

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-white/10 p-8 sm:p-12 shadow-xl shadow-indigo-950/20">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/25 mb-4 inline-block">
              Interactive Hub
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-4 mb-4">
              Explore Communities
            </h1>
            <p className="text-indigo-200/80 text-lg leading-relaxed font-medium">
              Join peer communities, project groups, study sessions, and alumni clubs. Connect directly with people who share your aspirations.
            </p>
          </div>
          <Link
            to="/communities/create"
            className="group flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/35 rounded-xl transition-all font-semibold shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 text-white" />
            Create Community
          </Link>
        </div>
      </div>

      {/* Categories Horizontal Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-2.5 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            !selectedCategory
              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          All Topics
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              selectedCategory === cat
                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Search Input bar */}
      <div className="relative group max-w-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative bg-white border border-slate-200 rounded-2xl flex items-center p-2.5 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/50 transition-all shadow-sm">
          <Search className="w-5 h-5 text-slate-400 ml-3 mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, tags, description..."
            className="bg-transparent border-none w-full text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-0 py-2"
          />
        </div>
      </div>

      {/* Grid List */}
      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 h-52 skeleton animate-pulse" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm max-w-lg mx-auto flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Communities Found</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Be the first to create one for your friends, academic branch, or tech club!</p>
          <Link
            to="/communities/create"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Create Community <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((comm) => {
            const hasJoined = comm.viewerMembership || comm.isMember;
            return (
              <div
                key={comm._id}
                className="group relative bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Cover Accent */}
                <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-500" />
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {comm.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        comm.visibility === "public"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}>
                        {comm.visibility}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs font-semibold mb-4 line-clamp-2 min-h-8">
                      {comm.description || "No description provided."}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mb-4 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        {comm.membersCount || comm.memberCount || 1} Member{ (comm.membersCount || comm.memberCount || 1) !== 1 ? 's' : '' }
                      </span>
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-slate-500">
                        {comm.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 border-t border-slate-50 pt-4">
                    <Link
                      to={`/communities/${comm._id}`}
                      className="flex-1 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all"
                    >
                      Enter Community
                    </Link>
                    {!hasJoined && comm.visibility === "private" && (
                      <button
                        onClick={() => requestMut.mutate(comm._id)}
                        disabled={requestMut.isPending}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm shadow-amber-500/10"
                      >
                        Request to Join
                      </button>
                    )}
                    {!hasJoined && comm.visibility !== "private" && (
                      <button
                        onClick={() => joinMut.mutate(comm._id)}
                        disabled={joinMut.isPending}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-600/10"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
