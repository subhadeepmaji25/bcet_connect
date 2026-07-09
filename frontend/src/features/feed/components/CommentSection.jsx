import { useState, useRef, useEffect } from "react";
import { useComments } from "../hooks/useComments";
import { feedApi } from "../../../api/feedApi";
import CommentItem from "./CommentItem";
import { Send, Loader2 } from "lucide-react";

const CommentSection = ({ postId }) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useComments(postId);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loaderRef = useRef(null);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await feedApi.createComment(postId, { content: commentText });
      setCommentText("");
      refetch(); // Reload comments to show the new one
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const comments = data?.pages.flatMap((page) => page.data.comments || []) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Top-level comment input */}
      <div className="flex gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          maxLength={1000}
          placeholder="Write a comment..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 shadow-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !commentText.trim()}
          className="btn-primary flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center p-0 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-0.5 mt-0.5" />}
        </button>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first to comment!</p>
          )}
          <div ref={loaderRef} className="flex justify-center py-2 h-10">
            {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
