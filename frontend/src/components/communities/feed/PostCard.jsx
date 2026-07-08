import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Pin, Heart, MessageCircle, Trash2, Paperclip } from "lucide-react";
import { deletePost, pinPost, likePost } from "../../../api/community.api";
import { hasPermission } from "../../../constants/communityPermissions";
import { useAuth } from "../../../hooks/useAuth";
import Avatar from "../../ui/Avatar";
import toast from "react-hot-toast";
import CommentSection from "./CommentSection";

export default function PostCard({ post, role, communityId }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  // Backend field is `pinned` (not `isPinned`)
  const isPinned = post.pinned || false;
  // Backend populate returns authorId as object { username, role, avatar }
  const authorName = post.authorId?.username || post.authorId?.fullName || post.authorName || "Unknown";
  const authorAvatar = post.authorId?.avatar || post.authorAvatar || "";
  // Backend uses likeCount (not likesCount)
  const [likesCount, setLikesCount] = useState(post.likeCount || post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);

  const deleteMut = useMutation({
    mutationFn: () => deletePost(post._id),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ['community-feed', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete");
    }
  });

  const pinMut = useMutation({
    mutationFn: (data) => pinPost(post._id, data),
    onSuccess: () => {
      toast.success(post.isPinned ? "Unpinned post" : "Pinned post");
      queryClient.invalidateQueries({ queryKey: ['community-feed', communityId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to pin");
    }
  });

  // Backend has no per-user like tracking — simple optimistic increment only
  const likeMut = useMutation({
    mutationFn: () => likePost(post._id),
    onMutate: () => { setLikesCount((c) => c + 1); },
    onError: (err) => {
      setLikesCount((c) => c - 1);
      toast.error(err.message || "Failed to like");
    }
  });

  const myId = (currentUser?.userId || currentUser?._id)?.toString();
  const authorIdStr = (post.authorId?._id || post.authorId)?.toString();

  const canDelete = hasPermission(role, "delete_post") || myId === authorIdStr;
  const canPin = hasPermission(role, "pin_post");

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 relative transition-all duration-300 ${
      isPinned ? "border-indigo-100 bg-indigo-50/10" : "border-slate-100"
    } ${post.isOptimistic ? "opacity-60 animate-pulse pointer-events-none" : ""}`}>
      {isPinned && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 border border-indigo-200 rounded-md">
          <Pin className="w-3 h-3 fill-current" /> Pinned
        </div>
      )}

      {/* Author info */}
      <div className="flex items-center gap-3">
        <Avatar src={authorAvatar} name={authorName} size="sm" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-slate-800 leading-none">{authorName}</p>
            {post.postType === "announcement" && (
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">📢 Announcement</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">
            {new Date(post.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            {post.isEdited && <span className="ml-1 italic opacity-60">(edited)</span>}
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>
      
      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {post.attachments.map((att, idx) => (
             att.type === 'image' ? (
               <img key={idx} src={att.url} alt="attachment" className="max-w-full rounded-xl border border-slate-200 max-h-64 object-contain" />
             ) : att.type === 'video' ? (
               <video key={idx} src={att.url} controls className="max-w-full rounded-xl border border-slate-200 max-h-64" />
             ) : (
               <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 text-sm font-bold bg-indigo-50 px-3 py-2 rounded-xl">
                 <Paperclip className="w-4 h-4" /> Attachment file
               </a>
             )
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-50 flex-wrap">
        <button
          onClick={() => likeMut.mutate()}
          disabled={likeMut.isPending}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
        >
          <Heart className="w-4 h-4" /> {likesCount} {likesCount === 1 ? "Like" : "Likes"}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> {post.commentsCount || 0} Comments
        </button>

        {canPin && (
          <button
            onClick={() => pinMut.mutate({ pin: !isPinned })}
            disabled={pinMut.isPending}
            className={`flex items-center gap-1.5 text-xs font-bold ml-auto transition-colors ${
              isPinned ? "text-indigo-600 hover:text-indigo-800" : "text-slate-400 hover:text-indigo-600"
            }`}
          >
            <Pin className="w-3.5 h-3.5" /> {isPinned ? "Unpin" : "Pin"}
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => { if (window.confirm("Delete this post?")) deleteMut.mutate(); }}
            disabled={deleteMut.isPending}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>

      {showComments && (
        <CommentSection postId={post._id} />
      )}
    </div>
  );
}
