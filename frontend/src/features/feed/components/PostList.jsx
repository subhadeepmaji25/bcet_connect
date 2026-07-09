import { useEffect, useMemo, useRef } from "react";
import { useFeed } from "../hooks/useFeed";
import PostCard from "./PostCard";
import { Loader2, Sparkles, ShieldAlert } from "lucide-react";

const FeedSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="flex-1">
        <div className="h-3 w-36 bg-slate-200 rounded mb-2" />
        <div className="h-2 w-24 bg-slate-100 rounded" />
      </div>
    </div>
    <div className="h-3 w-full bg-slate-100 rounded mb-2" />
    <div className="h-3 w-4/5 bg-slate-100 rounded mb-2" />
    <div className="h-40 bg-slate-100 rounded-xl" />
  </div>
);

const PostList = ({ scope = "feed", filters = {} }) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useFeed({ scope, filters });
  const loaderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = useMemo(
    () => data?.pages.flatMap((page) => page.data?.posts || []) ?? [],
    [data]
  );

  const posts = useMemo(() => {
    if (scope === "recommended") return allPosts.filter((post) => post.isRecommendation);
    if (scope === "connections") return allPosts.filter((post) => !post.isRecommendation && !post.isCommunityPost);
    if (scope === "pinned") return allPosts.filter((post) => post.isPinned);
    if (scope === "announcements") return allPosts.filter((post) => post.type === "announcement");
    if (scope === "saved") return allPosts.filter((post) => post.bookmarked || post.bookmarkedAt);
    return allPosts;
  }, [allPosts, scope]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          <Sparkles className="w-4 h-4" />
          Loading your feed
        </div>
        <FeedSkeleton />
        <FeedSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-red-200 shadow-sm">
        <ShieldAlert className="w-10 h-10 mx-auto text-red-500 mb-3" />
        <p className="text-red-700 font-semibold">Feed could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="feed-list flex flex-col">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      {posts.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium">No posts to show right now.</p>
          <p className="text-sm text-slate-400 mt-1">Try switching filters or wait for new activity.</p>
        </div>
      )}

      <div ref={loaderRef} className="flex justify-center py-4 h-12 mt-2">
        {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary-400" />}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-sm text-slate-400 font-medium">You've caught up on everything!</p>
        )}
      </div>
    </div>
  );
};

export default PostList;
