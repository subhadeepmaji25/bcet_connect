import { useState, useRef, useEffect } from "react";
import { useCreatePost } from "../hooks/useCreatePost";
import AttachmentUploader from "./AttachmentUploader";
import { Send, Image as ImageIcon, Globe, Lock, Megaphone, Sparkles, ChevronDown } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

const POST_TYPES = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "document", label: "Document" },
  { value: "achievement", label: "Achievement" },
  { value: "resource", label: "Resource" },
  { value: "project_showcase", label: "Project Showcase" }
];

const CreatePostBox = () => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [type, setType] = useState("text");
  const { mutate: createPost, isPending } = useCreatePost();
  const textareaRef = useRef(null);

  const canCreateAnnouncement = ["faculty", "admin"].includes(user?.role);
  const showAnnouncement = canCreateAnnouncement;

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) {
      alert("Post must have content or an attachment");
      return;
    }
    createPost(
      {
        type,
        content,
        attachments,
        tags: [],
        mentions: [],
        visibility
      },
      {
        onSuccess: () => {
          setContent("");
          setAttachments([]);
          setVisibility("public");
          setType("text");
          if (textareaRef.current) textareaRef.current.style.height = "auto";
        },
        onError: (err) => alert(err?.response?.data?.message || err.message || "Failed to post")
      }
    );
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="bg-white rounded-[28px] shadow-[0_12px_40px_rgba(15,23,42,0.08)] border border-slate-200/80 p-5 sm:p-6 mb-6 transition-all hover:shadow-[0_16px_50px_rgba(15,23,42,0.1)]">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#635BFF] via-[#7C3AED] to-[#EC4899] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#635BFF]/20">
            {user?.fullName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-black text-slate-900">Create post</p>
              <p className="text-xs text-slate-500">Share updates, wins, resources, or announcements with your network.</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
              Feed composer
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative">
              <select
                value={type}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setType(!canCreateAnnouncement && nextType === "announcement" ? "text" : nextType);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-full pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
              >
                {POST_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
                {showAnnouncement && <option value="announcement">Announcement</option>}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                visibility === "public"
                  ? "bg-[#635BFF]/10 border-[#635BFF]/20 text-[#635BFF]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Globe className="w-4 h-4" /> Public
            </button>

            <button
              type="button"
              onClick={() => setVisibility("connections_only")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                visibility === "connections_only"
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Lock className="w-4 h-4" /> Connections
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 focus-within:border-[#635BFF]/30 focus-within:bg-white transition-colors">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={3000}
              rows={2}
              className="w-full bg-transparent resize-none border-none focus:ring-0 p-0 text-slate-800 placeholder:text-slate-400 text-[15px] leading-relaxed outline-none overflow-hidden"
              placeholder="What do you want to share with your network?"
            />

            <AttachmentUploader attachments={attachments} setAttachments={setAttachments} />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Megaphone className="w-4 h-4" />
              {visibility === "connections_only" ? "Visible to connections" : "Visible to everyone"}
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="file-upload" className="px-4 py-2.5 text-[#635BFF] bg-[#635BFF]/10 hover:bg-[#635BFF]/15 border border-[#635BFF]/15 rounded-full cursor-pointer transition-colors flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-bold">Add media</span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={isPending || (!content.trim() && attachments.length === 0)}
                className={`rounded-full px-6 py-2.5 flex items-center gap-2 text-sm font-bold shadow-sm transition-all ${
                  isPending || (!content.trim() && attachments.length === 0)
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[#635BFF] hover:bg-[#524be3] text-white hover:shadow-lg active:scale-[0.98]"
                }`}
              >
                {isPending ? "Posting..." : "Post"}
                {!isPending && <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostBox;
