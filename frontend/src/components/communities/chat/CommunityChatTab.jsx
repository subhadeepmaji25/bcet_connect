import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Paperclip, X, Image as ImageIcon, FileText, Loader2, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getMessages, sendMessage, uploadChatFile, uploadChatVideo } from "../../../api/communication.api";
import { useAuth } from "../../../hooks/useAuth";
import Avatar from "../../ui/Avatar";

export default function CommunityChatTab({ conversationId, isMuted }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const myIdStr = user?.userId || user?._id || "";

  const { data: msgData, isPending } = useQuery({
    queryKey: ["community-messages", conversationId],
    queryFn: () => getMessages(conversationId),
    refetchInterval: 3000,
    enabled: !!conversationId
  });

  useEffect(() => {
    if (msgData?.data?.messages) {
      setMessages(msgData.data.messages);
    }
  }, [msgData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMut = useMutation({
    mutationFn: async ({ text, fileToUpload }) => {
      let attachments = [];
      if (fileToUpload) {
        setIsUploading(true);
        try {
          const type = fileToUpload.type.startsWith("image/") ? "image" : fileToUpload.type.startsWith("video/") ? "video" : "document";
          let res;
          const formData = new FormData();
          if (type === "video") {
            formData.append("video", fileToUpload);
            res = await uploadChatVideo(formData);
          } else {
            formData.append("file", fileToUpload);
            res = await uploadChatFile(formData);
          }
          
          const attData = res.data?.attachment || res.attachment;
          if (attData) {
            attachments.push(attData);
          } else {
            const url = res.data?.fileUrl || res.data?.url || res.url;
            const publicId = res.data?.publicId || res.publicId || "default";
            attachments.push({ type, url, publicId, mimeType: fileToUpload.type, size: fileToUpload.size });
          }
        } finally {
          setIsUploading(false);
        }
      }
      return sendMessage(conversationId, { text, attachments });
    },
    onMutate: async ({ text, fileToUpload }) => {
      await queryClient.cancelQueries({ queryKey: ["community-messages", conversationId] });
      const previousData = queryClient.getQueryData(["community-messages", conversationId]);
      
      const optimisticMsg = {
        _id: "optimistic-" + Date.now(),
        senderId: { _id: myIdStr, username: user?.username || "You", avatar: user?.avatar },
        text: text,
        attachments: fileToUpload ? [{ type: fileToUpload.type.startsWith("image/") ? "image" : "document", url: URL.createObjectURL(fileToUpload) }] : [],
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };

      queryClient.setQueryData(["community-messages", conversationId], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            messages: [optimisticMsg, ...(old.data?.messages || [])]
          }
        };
      });

      setContent("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["community-messages", conversationId], context.previousData);
      }
      toast.error(err?.message || "Failed to send message");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community-messages', conversationId] });
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    if (isUploading || sendMut.isPending) return;
    sendMut.mutate({ text: content, fileToUpload: file });
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl h-[600px] shadow-sm flex flex-col justify-between overflow-hidden relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50">
        {messages.length === 0 && !isPending ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70 animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 rotate-3">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-slate-800 font-black text-sm">Start the Conversation</p>
            <p className="text-slate-500 text-xs font-semibold mt-1">Be the first to say hello to the community.</p>
          </div>
        ) : (
          messages.slice().reverse().map((msg, idx) => {
            const senderObj = msg.senderId || {};
            const senderIdStr = senderObj._id?.toString() || msg.senderId?.toString() || "";
            const isOwn = senderIdStr === myIdStr;
            const senderName = senderObj.username || "Unknown";
            const senderAvatar = senderObj.avatar || "";
            
            return (
              <div key={msg._id || idx} className={`flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 ${isOwn ? "justify-end" : "justify-start"} ${msg.isOptimistic ? "opacity-60" : ""}`}>
                {!isOwn && (
                  <div className="shrink-0 mt-1">
                    <Avatar src={senderAvatar} name={senderName} size="xs" className="ring-2 ring-white shadow-sm" />
                  </div>
                )}
                
                <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-[10px] font-extrabold text-slate-500 mb-1 ml-1 tracking-wide">{senderName}</span>
                  )}
                  
                  <div className={`relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed break-words shadow-sm transition-all ${
                    isOwn
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-sm shadow-indigo-500/20"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-black/5"
                  }`}>
                    {/* Render Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="rounded-xl overflow-hidden border border-black/10 bg-black/5 relative group">
                            {att.type === 'image' ? (
                              <img src={att.url} alt="attachment" className="max-w-full max-h-60 object-contain" />
                            ) : att.type === 'video' ? (
                              <video src={att.url} controls className="max-w-full max-h-60" />
                            ) : (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-3 ${isOwn ? 'text-white hover:bg-white/10' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                                <FileText className="w-5 h-5 shrink-0" />
                                <span className="font-bold underline text-xs">View Document</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <span className="font-medium">{msg.text}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.isOptimistic && <Loader2 className="w-2.5 h-2.5 text-indigo-400 animate-spin" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      {!isMuted ? (
        <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)] z-10">
          {/* File Preview Thumbnail */}
          {file && (
            <div className="mb-3 flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl w-max animate-in zoom-in-95 duration-200">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                ) : file.type.startsWith('video/') ? (
                   <PlayCircle className="w-5 h-5 text-slate-500" />
                ) : (
                  <FileText className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div className="flex flex-col max-w-[150px]">
                <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                <span className="text-[9px] font-semibold text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button onClick={removeFile} className="p-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-full text-slate-500 transition-colors ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if(e.target.files[0]) setFile(e.target.files[0]);
              }}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3.5 rounded-xl transition-all shadow-sm shrink-0 border ${
                file 
                ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                : "bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50"
              }`}
              title="Attach media or file"
            >
              {file && file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-4 pr-12 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all shadow-inner shadow-slate-100/50"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || sendMut.isPending || (!content.trim() && !file)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white p-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:hover:from-indigo-600 disabled:hover:to-indigo-500 shrink-0 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
              {isUploading || sendMut.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin relative z-10" />
              ) : (
                <Send className="w-5 h-5 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-red-50 text-red-700 text-center font-bold text-xs border-t border-red-100">
          You have been muted in this community.
        </div>
      )}
    </div>
  );
}
