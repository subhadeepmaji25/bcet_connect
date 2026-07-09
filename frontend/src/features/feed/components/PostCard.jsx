import { formatDistanceToNow } from "date-fns";
import PostActions from "./PostActions";
import { MoreHorizontal, FileText, Film, Globe, Lock, Pin, Sparkles, Megaphone, Users } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

const badgeForPost = (post) => {
  if (post.isRecommendation) return { label: "Recommended", icon: Sparkles, className: "bg-violet-50 text-violet-700 border-violet-200" };
  if (post.isCommunityPost) return { label: "Community", icon: Users, className: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  if (post.isPinned) return { label: "Pinned", icon: Pin, className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  if (post.type === "announcement") return { label: "Announcement", icon: Megaphone, className: "bg-amber-50 text-amber-700 border-amber-200" };
  return post.visibility === "connections_only"
    ? { label: "Connections only", icon: Lock, className: "bg-slate-100 text-slate-600 border-slate-200" }
    : { label: "Public", icon: Globe, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

const PostCard = ({ post }) => {
  const { user } = useAuth();
  const badge = badgeForPost(post);
  const BadgeIcon = badge.icon;
  const authorName = post.authorId?.username || post.author?.username || "Unknown User";
  const role = post.authorId?.role || post.author?.role || "";
  const canShowAdminTools = ["admin", "faculty"].includes(user?.role);
  const isModerated = post.status === "hidden" || post.moderationStatus === "blocked";

  return (
    <article className={`bg-white rounded-2xl shadow-sm border p-5 mb-6 hover:shadow-md transition-shadow relative ${
      post.isRecommendation ? "border-violet-200 bg-violet-50/20" : post.isCommunityPost ? "border-cyan-100 bg-cyan-50/15" : "border-slate-200"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg overflow-hidden">
            {post.authorId?.avatar || post.author?.avatar ? (
              <img src={post.authorId?.avatar || post.author?.avatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-800 text-[15px] truncate">{authorName}</h4>
              {role && <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{role}</span>}
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "just now"}
              <span>•</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full ${badge.className}`}>
                <BadgeIcon className="w-3 h-3" />
                {badge.label}
              </span>
            </p>
          </div>
        </div>
        {canShowAdminTools && (post.isPinned || post.isCommunityPost || post.isRecommendation) && (
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>

      {post.isRecommendation && (
        <div className="mb-4 rounded-2xl border border-violet-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-600">Suggested Job</p>
              <h3 className="font-extrabold text-slate-900 text-lg mt-1">{post.job?.title}</h3>
              <p className="text-sm text-slate-600">{post.job?.company} {post.job?.location ? `• ${post.job.location}` : ""}</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-full inline-flex">
                {post.matchLabel || "Recommended"}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-semibold">{post.matchScore ? `${post.matchScore}% match` : ""}</p>
            </div>
          </div>
        </div>
      )}

      {post.isCommunityPost && post.community && (
        <div className="mb-3 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-3">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-700">{post.community.name}</p>
          <p className="text-[12px] text-cyan-700/80 mt-1 font-semibold">Community post</p>
        </div>
      )}

      {isModerated && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <p className="text-xs font-black uppercase tracking-widest">Hidden content</p>
          <p className="text-sm font-medium mt-1">This post is currently not visible to most users.</p>
        </div>
      )}

      {post.content && (
        <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap mb-4">
          {post.content}
        </p>
      )}

      {post.attachments?.length > 0 && (
        <div className={`grid gap-2 mb-4 ${
          post.attachments.length === 1 ? "grid-cols-1" :
          post.attachments.length === 2 ? "grid-cols-2" :
          post.attachments.length >= 3 ? "grid-cols-2" : ""
        }`}>
          {post.attachments.map((a, idx) => (
            <div key={a.publicId || idx} className={`relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 ${
              post.attachments.length === 3 && idx === 0 ? "col-span-2" : ""
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

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <PostActions post={post} />
    </article>
  );
};

export default PostCard;
