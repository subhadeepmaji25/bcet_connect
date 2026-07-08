import React, { useMemo, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ShieldAlert, FileText, Pin } from "lucide-react";
import { getFeed } from "../../../api/community.api";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";

export default function CommunityFeedTab({ communityId, isMember, isMuted, role, isPrivate, community }) {
  // Use infinite query for the feed
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    error
  } = useInfiniteQuery({
    queryKey: ["community-feed", communityId],
    queryFn: async ({ pageParam }) => {
      const params = {};
      if (pageParam && typeof pageParam === "string" && pageParam.trim() !== "") {
        params.cursor = pageParam;
      }
      const res = await getFeed(communityId, params);
      return res; // Return full response { success, data, meta }
    },
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor || undefined,
    initialPageParam: undefined
  });

  // Extract pinned posts from the first page only
  const pinnedPosts = useMemo(() => {
    return data?.pages?.[0]?.data?.pinnedPosts || [];
  }, [data]);

  // Flatten normal posts
  const normalPosts = useMemo(() => {
    return data?.pages?.flatMap(page => page.data?.posts || []) || [];
  }, [data]);

  if (!isMember && isPrivate) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto flex flex-col items-center">
        <ShieldAlert className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">This Community is Private</h3>
        <p className="text-slate-500 text-xs mt-1">Join the community to unlock members access and view posts.</p>
      </div>
    );
  }

  const showComposer = isMember && !isMuted;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        {/* Post Composer */}
        {showComposer && (
          <PostComposer communityId={communityId} role={role} />
        )}

        {/* Pinned Posts */}
        {pinnedPosts.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Pin className="w-4 h-4 text-indigo-500" /> Pinned Announcements
            </h4>
            {pinnedPosts.map((post) => (
              <PostCard key={post._id} post={post} role={role} communityId={communityId} />
            ))}
          </div>
        )}

        {/* Feed Posts */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Normal Feed</h4>
          {isPending ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 h-36 skeleton animate-pulse" />
            ))
          ) : normalPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center shadow-sm text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-semibold">No normal posts yet.</p>
            </div>
          ) : (
            normalPosts.map((post) => (
              <PostCard key={post._id} post={post} role={role} communityId={communityId} />
            ))
          )}
        </div>

        {/* Load More Pagination */}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full text-center bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold text-xs py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading more..." : "Load More Posts"}
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Community Info</h4>
        {community?.description && (
          <p className="text-slate-600 text-xs leading-relaxed font-semibold">
            {community.description}
          </p>
        )}
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-50">
          {community?.memberCount !== undefined && (
            <span>👥 {community.memberCount} Member{community.memberCount !== 1 ? "s" : ""}</span>
          )}
          {community?.category && (
            <span className="capitalize">📂 {community.category}</span>
          )}
          {community?.visibility && (
            <span className="capitalize">{community.visibility === "public" ? "🌐" : "🔒"} {community.visibility}</span>
          )}
        </div>
      </div>
    </div>
  );
}
