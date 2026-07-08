import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Video, X, Loader2 } from "lucide-react";
import { createPost } from "../../../api/community.api";
import { uploadChatFile, uploadChatVideo } from "../../../api/communication.api";
import toast from "react-hot-toast";
import { hasPermission } from "../../../constants/communityPermissions";

export default function PostComposer({ communityId, role }) {
  const queryClient = useQueryClient();
  const [composerText, setComposerText] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [attachments, setAttachments] = useState([]); // Array of { id, type, file, url, isUploading }
  const fileInputRef = useRef(null);

  const canMakeAnnouncement = hasPermission(role, "manage_feed");

  const postMut = useMutation({
    mutationFn: (data) => createPost(communityId, data),
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ["community-feed", communityId] });
      const previousFeed = queryClient.getQueryData(["community-feed", communityId]);
      
      // Optimistically add the new post to the first page immutably
      queryClient.setQueryData(["community-feed", communityId], (old) => {
        if (!old || !old.pages || !old.pages[0]) return old;
        
        const newPages = old.pages.map((page, index) => {
          if (index === 0) {
            const newPostObj = {
              _id: "optimistic-" + Date.now(),
              communityId,
              authorId: { _id: "me", username: "You (Posting...)", role: role },
              content: newPost.content,
              postType: newPost.postType,
              attachments: newPost.attachments || [],
              pinned: false,
              likeCount: 0,
              commentCount: 0,
              createdAt: new Date().toISOString(),
              isOptimistic: true
            };

            if (page.data) {
              return {
                ...page,
                data: {
                  ...page.data,
                  posts: [newPostObj, ...(page.data.posts || [])]
                }
              };
            } else {
              return {
                ...page,
                posts: [newPostObj, ...(page.posts || [])]
              };
            }
          }
          return page;
        });
        
        return { ...old, pages: newPages };
      });
      
      setComposerText("");
      setIsAnnouncement(false);
      setAttachments([]);
      
      return { previousFeed };
    },
    onError: (err, newPost, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["community-feed", communityId], context.previousFeed);
      }
      toast.error(err.message || "Failed to post");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community-feed", communityId] });
    },
    onSuccess: () => {
      toast.success("Post published!");
    }
  });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";
      const attachmentId = Math.random().toString(36).substring(7);
      
      setAttachments(prev => [...prev, { id: attachmentId, type, file, isUploading: true }]);

      try {
        let res;
        const formData = new FormData();
        if (type === "video") {
          formData.append("video", file);
          res = await uploadChatVideo(formData);
        } else {
          formData.append("file", file);
          res = await uploadChatFile(formData);
        }
        
        // Backend returns: { data: { attachment: { type, url, publicId, mimeType, size, originalName } } }
        const attData = res.data?.attachment || res.attachment;
        if (attData) {
          setAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, ...attData, isUploading: false } : a));
        } else {
          // Fallback if data is missing
          const url = res.data?.fileUrl || res.data?.url || res.data || res.fileUrl || res.url;
          const publicId = res.data?.publicId || res.publicId || attachmentId;
          setAttachments(prev => prev.map(a => a.id === attachmentId ? { ...a, url, publicId, mimeType: file.type, size: file.size, isUploading: false } : a));
        }
      } catch (err) {
        toast.error("Failed to upload " + file.name);
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      }
    }
    
    // Clear input so same file can be uploaded again if removed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!composerText.trim() && attachments.length === 0) return;
    
    if (attachments.some(a => a.isUploading)) {
      toast.error("Please wait for uploads to finish");
      return;
    }

    const payload = {
      content: composerText,
      postType: isAnnouncement ? "announcement" : "normal",
      // Pass the full attachment object from state, removing frontend-only fields
      attachments: attachments.map(({ id, file, isUploading, ...rest }) => rest)
    };

    postMut.mutate(payload);
  };

  return (
    <form onSubmit={handlePostSubmit} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
      <textarea
        value={composerText}
        onChange={(e) => setComposerText(e.target.value)}
        placeholder="What's happening? Ask a question or share resources..."
        className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none resize-none min-h-[80px]"
      />
      
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {attachments.map(att => (
            <div key={att.id} className="relative flex items-center justify-center w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
              {att.isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : att.type === 'image' ? (
                <img src={att.url || URL.createObjectURL(att.file)} alt="attachment" className="w-full h-full object-cover" />
              ) : att.type === 'video' ? (
                <Video className="w-6 h-6 text-slate-500" />
              ) : (
                <Paperclip className="w-6 h-6 text-slate-500" />
              )}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Paperclip className="w-4 h-4" /> Add File
          </button>
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {canMakeAnnouncement && (
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="accent-indigo-600 rounded"
              />
              Announcement
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={postMut.isPending || (composerText.trim() === "" && attachments.length === 0) || attachments.some(a => a.isUploading)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-600/10 disabled:opacity-40"
        >
          {postMut.isPending ? "Posting..." : "Publish Post"}
        </button>
      </div>
    </form>
  );
}
