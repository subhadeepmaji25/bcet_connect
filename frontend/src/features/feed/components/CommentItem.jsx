import { useState } from "react";
import { feedApi } from "../../../api/feedApi";
import { formatDistanceToNow } from "date-fns";
import { CornerDownRight, MessageSquare, Loader2, Flag, Heart, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const COMMENT_REACTIONS = [
  { type: "like", icon: Heart, label: "Like" },
  { type: "support", icon: Heart, label: "Support" },
  { type: "insightful", icon: Sparkles, label: "Insightful" }
];

const CommentItem = ({ comment, depth = 0 }) => {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [reactionType, setReactionType] = useState(comment.myReaction || null);
  const [reactionCount, setReactionCount] = useState(comment.likeCount || 0);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("spam");

  const loadReplies = async () => {
    if (!showReplies) {
      setLoadingReplies(true);
      try {
        const res = await feedApi.getReplies(comment._id);
        setReplies(res.data.replies || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load replies");
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(!showReplies);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await feedApi.createComment(comment.postId, {
        content: replyText,
        parentCommentId: comment._id
      });
      setReplyText("");
      setShowReplyBox(false);
      const res = await feedApi.getReplies(comment._id);
      setReplies(res.data.replies || []);
      setShowReplies(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const reactToComment = async (type) => {
    try {
      await feedApi.reactToComment(comment._id, type);
      setReactionType(type);
      setReactionCount((n) => n + (reactionType === type ? -1 : reactionType ? 0 : 1));
      setShowReactions(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to react");
    }
  };

  const reportComment = async () => {
    try {
      await feedApi.createReport({
        targetType: "comment",
        targetId: comment._id,
        reason: reportReason,
        note: ""
      });
      toast.success("Comment reported");
      setShowReportForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to report");
    }
  };

  const isHidden = comment.status === "hidden" || comment.moderationStatus === "blocked";

  return (
    <div className={`mt-3 ${depth > 0 ? "ml-6 sm:ml-10 relative" : ""}`}>
      {depth > 0 && (
        <div className="absolute -left-6 top-4 w-4 h-4 border-l-2 border-b-2 border-slate-200 rounded-bl-lg" />
      )}
      <div className={`border rounded-2xl p-3 sm:p-4 transition-shadow ${isHidden ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100 hover:shadow-sm"}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
            {comment.authorId?.avatar ? (
              <img src={comment.authorId.avatar} alt={comment.authorId?.username || "User"} className="w-full h-full object-cover" />
            ) : (
              comment.authorId?.username?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div>
            <h5 className="font-semibold text-sm text-slate-800">{comment.authorId?.username || "Unknown User"}</h5>
            <p className="text-[10px] text-slate-500">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "just now"}
              {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
            </p>
          </div>
        </div>

        {isHidden ? (
          <p className="text-sm text-amber-900 font-semibold ml-10">This comment is hidden by moderation.</p>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ml-10">
            {comment.content}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2 ml-10 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setShowReactions((v) => !v)}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 flex items-center gap-1 transition-colors"
            >
              <Heart className="w-3 h-3" /> {reactionCount}
            </button>
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg px-2 py-2 z-20">
                {COMMENT_REACTIONS.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => reactToComment(type)}
                    title={label}
                    className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="text-xs font-semibold text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
          >
            <MessageSquare className="w-3 h-3" /> Reply
          </button>

          <button
            onClick={() => setShowReportForm((v) => !v)}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Flag className="w-3 h-3" /> Report
          </button>

          {(comment.replyCount > 0 || replies.length > 0) && (
            <button
              onClick={loadReplies}
              className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:underline"
            >
              {loadingReplies && <Loader2 className="w-3 h-3 animate-spin" />}
              {!loadingReplies && <CornerDownRight className="w-3 h-3" />}
              {showReplies ? "Hide replies" : `View replies (${comment.replyCount || replies.length})`}
            </button>
          )}
        </div>

        {showReportForm && (
          <div className="mt-3 ml-10 flex flex-col gap-2 border border-red-100 bg-red-50/50 rounded-2xl p-3">
            <div className="flex flex-wrap gap-2">
              {["spam", "harassment", "hate", "misinformation", "other"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize border ${
                    reportReason === reason ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-red-100"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={reportComment}
              className="self-end px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
            >
              Report Comment
            </button>
          </div>
        )}
      </div>

      {showReplyBox && (
        <div className="mt-2 ml-10 flex gap-2 items-center">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={1000}
            className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 shadow-sm"
            placeholder={`Reply to ${comment.authorId?.username || "user"}...`}
            autoFocus
          />
          <button
            onClick={submitReply}
            disabled={submittingReply || !replyText.trim()}
            className="btn-primary rounded-full px-4 py-2 text-sm disabled:opacity-50 flex items-center justify-center min-w-[70px]"
          >
            {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reply"}
          </button>
        </div>
      )}

      {showReplies && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          {replies.map((r) => (
            <CommentItem key={r._id} comment={r} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
