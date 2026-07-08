import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { getComments, createComment } from "../../../api/community.api";
import Avatar from "../../ui/Avatar";
import toast from "react-hot-toast";

export default function CommentSection({ postId }) {
  const queryClient = useQueryClient();
  const [commentVal, setCommentVal] = useState("");

  const { data: comData, isPending } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => getComments(postId)
  });

  const comMut = useMutation({
    mutationFn: (data) => createComment(postId, data),
    onSuccess: () => {
      setCommentVal("");
      toast.success("Comment posted");
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to comment");
    }
  });

  const comments = comData?.data?.comments || comData?.data || [];

  return (
    <div className="pt-4 border-t border-slate-100 space-y-4">
      {/* Create comment */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (commentVal.trim()) comMut.mutate({ content: commentVal }); }}
        className="flex items-center gap-2.5"
      >
        <input
          type="text"
          value={commentVal}
          onChange={(e) => setCommentVal(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          disabled={comMut.isPending || !commentVal.trim()}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {/* List comments */}
      {isPending ? (
        <div className="h-10 skeleton animate-pulse rounded-xl bg-slate-100" />
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-slate-400 font-bold px-2">No comments yet. Write the first one!</p>
      ) : (
        <div className="space-y-3 pl-2">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-2.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Avatar src={comment.authorAvatar || ""} name={comment.authorName || "?"} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800">{comment.authorName}</p>
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {new Date(comment.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-slate-600 font-medium mt-0.5 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
