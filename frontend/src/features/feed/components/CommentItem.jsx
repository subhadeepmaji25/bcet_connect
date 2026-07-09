import { useState } from "react";
import { feedApi } from "../../../api/feedApi";
import { formatDistanceToNow } from "date-fns";
import { CornerDownRight, MessageSquare, Loader2 } from "lucide-react";

const CommentItem = ({ comment, depth = 0 }) => {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadReplies = async () => {
    if (!showReplies) {
      setLoadingReplies(true);
      try {
        const res = await feedApi.getReplies(comment._id);
        setReplies(res.data.replies || []);
      } catch (err) {
        console.error("Failed to load replies", err);
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
      // Refresh replies
      const res = await feedApi.getReplies(comment._id);
      setReplies(res.data.replies || []);
      setShowReplies(true);
    } catch (err) {
      console.error("Failed to reply", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className={`mt-3 ${depth > 0 ? "ml-6 sm:ml-10 relative" : ""}`}>
      {depth > 0 && (
        <div className="absolute -left-6 top-4 w-4 h-4 border-l-2 border-b-2 border-slate-200 rounded-bl-lg" />
      )}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
            {comment.authorId?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h5 className="font-semibold text-sm text-slate-800">{comment.authorId?.username || "Unknown User"}</h5>
            <p className="text-[10px] text-slate-500">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "just now"}
            </p>
          </div>
        </div>
        
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ml-10">
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4 mt-2 ml-10">
          <button 
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="text-xs font-semibold text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
          >
            <MessageSquare className="w-3 h-3" /> Reply
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
      </div>

      {showReplyBox && (
        <div className="mt-2 ml-10 flex gap-2 items-center">
          <input 
            value={replyText} 
            onChange={(e) => setReplyText(e.target.value)} 
            maxLength={1000} 
            className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 shadow-sm"
            placeholder={`Reply to ${comment.authorId?.username}...`}
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
