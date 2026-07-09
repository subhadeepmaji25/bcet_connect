import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  MoreHorizontal,
  Sparkles
} from "lucide-react";
import CommentSection from "./CommentSection";
import { feedApi } from "../../../api/feedApi";
import { useAuth } from "../../../hooks/useAuth";
import toast from "react-hot-toast";

const REACTIONS = [
  { type: "like", label: "Like", icon: Heart },
  { type: "celebrate", label: "Celebrate", icon: Sparkles },
  { type: "support", label: "Support", icon: Heart },
  { type: "insightful", label: "Insightful", icon: MessageCircle },
  { type: "curious", label: "Curious", icon: MessageCircle }
];

const PostActions = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportNote, setReportNote] = useState("");
  const { user } = useAuth();
  const qc = useQueryClient();

  const isRecommendation = Boolean(post.isRecommendation);
  const isCommunityPost = Boolean(post.isCommunityPost);
  const currentReaction = post.myReaction || post.reactionType || null;
  const likeCount = post.likeCount || 0;
  const commentCount = post.commentCount || 0;
  const bookmarkCount = post.bookmarked ? 1 : 0;

  const reactionMut = useMutation({
    mutationFn: (type) => (isCommunityPost
      ? feedApi.reactToPost(post._id, type)
      : feedApi.reactToPost(post._id, type)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Reaction updated");
      setShowReactions(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || err.message || "Failed to react")
  });

  const bookmarkMut = useMutation({
    mutationFn: () => feedApi.toggleBookmark(post._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(post.bookmarked ? "Bookmark removed" : "Saved");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err.message || "Failed to bookmark")
  });

  const reportMut = useMutation({
    mutationFn: () => feedApi.createReport({
      targetType: post.isCommunityPost ? "post" : "post",
      targetId: post._id,
      reason: reportReason,
      note: reportNote
    }),
    onSuccess: () => {
      toast.success("Report submitted");
      setShowReportForm(false);
      setReportNote("");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || err.message || "Failed to report")
  });

  if (isRecommendation || isCommunityPost) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {isRecommendation ? "Suggested content" : "Community content"}
          </p>
          <button className="text-xs font-bold text-primary-600 hover:text-primary-700">
            Open
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-5 mb-2 flex-wrap">
        <div className="relative">
          <button
          onClick={() => setShowReactions((v) => !v)}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            className={`flex items-center gap-2 group transition-colors ${
              currentReaction ? "text-rose-500" : "text-slate-500 hover:text-rose-500"
            }`}
          >
            <div className={`p-2 rounded-full transition-colors ${
              currentReaction ? "bg-rose-50" : "group-hover:bg-rose-50"
            }`}>
              <Heart className={`w-5 h-5 ${currentReaction ? "fill-current" : ""}`} />
            </div>
            <span className="font-medium text-sm">{likeCount}</span>
          </button>

          {showReactions && (
            <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg px-2 py-2 z-20">
              {REACTIONS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => reactionMut.mutate(type)}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  title={label}
                >
                  <Icon className={`w-4 h-4 ${currentReaction === type ? "text-primary-600" : "text-slate-500"}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 group transition-colors ${
            showComments ? "text-primary-600" : "text-slate-500 hover:text-primary-600"
          }`}
        >
          <div className={`p-2 rounded-full transition-colors ${
            showComments ? "bg-primary-50" : "group-hover:bg-primary-50"
          }`}>
            <MessageCircle className={`w-5 h-5 ${showComments ? "fill-current opacity-20" : ""}`} />
          </div>
          <span className="font-medium text-sm">{commentCount}</span>
        </button>

        <button
          onClick={() => bookmarkMut.mutate()}
          className="flex items-center gap-2 text-slate-500 hover:text-amber-600 group transition-colors"
        >
          <div className="p-2 rounded-full group-hover:bg-amber-50 transition-colors">
            <Bookmark className={`w-5 h-5 ${bookmarkCount ? "fill-current text-amber-600" : ""}`} />
          </div>
        </button>

        <button
          onClick={() => setShowReportForm((v) => !v)}
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 group transition-colors"
        >
          <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
            <Flag className="w-5 h-5" />
          </div>
        </button>

        <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 group transition-colors ml-auto">
          <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
            <Share2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {showReportForm && !isRecommendation && (
        <div className="mb-3 rounded-2xl border border-red-100 bg-red-50/50 p-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {["spam", "harassment", "hate", "misinformation", "other"].map((reason) => (
              <button
                key={reason}
                onClick={() => setReportReason(reason)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${
                  reportReason === reason
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-slate-600 border-red-100"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <textarea
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Add a note for the moderation team"
            maxLength={500}
            className="w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowReportForm(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={() => reportMut.mutate()}
              className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
            >
              Report
            </button>
          </div>
        </div>
      )}

      {showComments && (
        <div className="pt-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <CommentSection postId={post._id} />
        </div>
      )}
    </div>
  );
};

export default PostActions;
