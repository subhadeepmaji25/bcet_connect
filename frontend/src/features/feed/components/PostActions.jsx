import { useState } from "react";
import { useToggleLike } from "../hooks/useToggleLike";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import CommentSection from "./CommentSection";

const PostActions = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const { mutate: toggleLike } = useToggleLike(post._id);

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-6 mb-2">
        <button
          onClick={() => toggleLike()}
          className={`flex items-center gap-2 group transition-colors ${
            post.likedByMe ? "text-rose-500" : "text-slate-500 hover:text-rose-500"
          }`}
        >
          <div className={`p-2 rounded-full transition-colors ${
            post.likedByMe ? "bg-rose-50" : "group-hover:bg-rose-50"
          }`}>
            <Heart className={`w-5 h-5 ${post.likedByMe ? "fill-current" : ""}`} />
          </div>
          <span className="font-medium text-sm">{post.likeCount || 0}</span>
        </button>

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
          <span className="font-medium text-sm">{post.commentCount || 0}</span>
        </button>

        <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 group transition-colors ml-auto">
          <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
            <Share2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {showComments && (
        <div className="pt-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <CommentSection postId={post._id} />
        </div>
      )}
    </div>
  );
};

export default PostActions;
