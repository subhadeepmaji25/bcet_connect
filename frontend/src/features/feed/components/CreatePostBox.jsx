import { useState, useRef, useEffect } from "react";
import { useCreatePost } from "../hooks/useCreatePost";
import AttachmentUploader from "./AttachmentUploader";
import { Send, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

const CreatePostBox = () => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const { mutate: createPost, isPending } = useCreatePost();
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) {
      alert("Post must have content or an attachment");
      return;
    }
    createPost(
      { type: "text", content, attachments, tags: [], mentions: [], visibility: "public" },
      {
        onSuccess: () => {
          setContent("");
          setAttachments([]);
          if (textareaRef.current) textareaRef.current.style.height = "auto";
        },
        onError: (err) => alert(err.message || "Failed to post")
      }
    );
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 transition-all hover:shadow-md">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner">
          {user?.fullName?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={3000}
            rows={1}
            className="w-full bg-transparent resize-none border-none focus:ring-0 p-2 text-slate-800 placeholder:text-slate-400 text-lg leading-relaxed outline-none overflow-hidden"
            placeholder="What do you want to share with your network?"
          />
          
          <AttachmentUploader attachments={attachments} setAttachments={setAttachments} />
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label htmlFor="file-upload" className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full cursor-pointer transition-colors flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-semibold hidden sm:inline-block pr-1">Media</span>
              </label>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isPending || (!content.trim() && attachments.length === 0)}
              className={`rounded-full px-6 py-2.5 flex items-center gap-2 text-sm font-bold shadow-sm transition-all ${
                isPending || (!content.trim() && attachments.length === 0)
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 text-white hover:shadow-md active:scale-95"
              }`}
            >
              {isPending ? "Posting..." : "Post"}
              {!isPending && <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostBox;
