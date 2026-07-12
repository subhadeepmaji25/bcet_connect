import { Bookmark } from "lucide-react";
import { useBookmarkResource } from "../../hooks/useResourceEngagement";
import { useState, useEffect } from "react";

export const BookmarkButton = ({ resourceId, initialStatus = false }) => {
  const { mutate: toggleBookmark, isPending } = useBookmarkResource();
  const [isBookmarked, setIsBookmarked] = useState(initialStatus);

  useEffect(() => {
    setIsBookmarked(initialStatus);
  }, [initialStatus]);

  const handleToggle = () => {
    // Optimistic UI update
    setIsBookmarked(!isBookmarked);
    toggleBookmark(resourceId, {
      onError: () => {
        // Revert on error
        setIsBookmarked(isBookmarked);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`p-2.5 rounded-lg border transition-all flex items-center justify-center ${
        isBookmarked 
          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" 
          : "bg-[#0f0f1a] border-white/10 text-slate-400 hover:text-white hover:border-white/30"
      }`}
      title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
    >
      <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
    </button>
  );
};
