import { formatDistanceToNow } from "date-fns";
import PostActions from "./PostActions";
import { MoreHorizontal, FileText, Film } from "lucide-react";

const PostCard = ({ post }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
            {post.authorId?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-[15px]">{post.authorId?.username || "Unknown User"}</h4>
            <p className="text-xs text-slate-500 font-medium">
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "just now"}
              {post.visibility === "connections" ? " • Connections only" : " • Public"}
            </p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap mb-4">
          {post.content}
        </p>
      )}

      {/* Attachments */}
      {post.attachments?.length > 0 && (
        <div className={`grid gap-2 mb-4 ${
          post.attachments.length === 1 ? 'grid-cols-1' : 
          post.attachments.length === 2 ? 'grid-cols-2' : 
          post.attachments.length >= 3 ? 'grid-cols-2' : ''
        }`}>
          {post.attachments.map((a, idx) => (
            <div key={a.publicId || idx} className={`relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 ${
              post.attachments.length === 3 && idx === 0 ? 'col-span-2' : ''
            }`}>
              {a.type === "image" ? (
                <img 
                  src={a.url} 
                  alt="Post attachment" 
                  className="w-full h-auto max-h-[400px] object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                />
              ) : (
                <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                    {a.type === "video" ? <Film className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.originalName || "Attachment"}</p>
                    {a.size && <p className="text-xs text-slate-500">{(a.size / 1024 / 1024).toFixed(2)} MB</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions (Like/Comment/Share) */}
      <PostActions post={post} />
    </div>
  );
};

export default PostCard;
