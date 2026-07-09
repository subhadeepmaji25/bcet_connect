import { useEffect, useRef } from "react";
import { useFeed } from "../hooks/useFeed";
import PostCard from "./PostCard";
import { Loader2 } from "lucide-react";

const PostList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed();
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
        <p className="text-slate-500 font-medium">Loading your feed...</p>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.data?.posts || []) ?? [];

  return (
    <div className="feed-list flex flex-col">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      
      {posts.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium">No posts to show right now.</p>
          <p className="text-sm text-slate-400 mt-1">Be the first to share something!</p>
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
