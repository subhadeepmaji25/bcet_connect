import { useState } from "react";
import { attachmentApi } from "../../../api/attachmentApi";
import { X, Image as ImageIcon, FileText, Film, Loader2 } from "lucide-react";

const AttachmentUploader = ({ attachments, setAttachments }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (attachments.length >= 4) {
      alert("Max 4 attachments per post");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await attachmentApi.uploadFile(file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="mt-3">
      {/* Hidden file input */}
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
        accept="image/*,video/*,.pdf"
      />

      <div className="flex flex-wrap gap-3">
        {attachments.map((a, i) => (
          <div key={a.publicId || i} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-24 h-24 flex items-center justify-center">
            {a.type === "image" ? (
              <img src={a.url} alt="Attachment" className="w-full h-full object-cover" />
            ) : a.type === "video" ? (
              <Film className="w-8 h-8 text-slate-400" />
            ) : (
              <FileText className="w-8 h-8 text-slate-400" />
            )}
            
            <button
              type="button"
              onClick={() => removeAttachment(i)}
              className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {attachments.length > 0 && attachments.length < 4 && (
          <label
            htmlFor="file-upload"
            className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-all"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-semibold">Add More</span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
};

export default AttachmentUploader;
