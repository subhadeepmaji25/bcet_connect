import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useRateResource, useMyRating } from "../../hooks/useResourceEngagement";
import toast from "react-hot-toast";

export const RatingStars = ({ resourceId }) => {
  const { data: myRatingData } = useMyRating(resourceId);
  const { mutate: rateResource, isPending } = useRateResource();
  
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (myRatingData?.data?.rating) {
      setRating(myRatingData.data.rating);
    }
  }, [myRatingData]);

  const handleRate = (value) => {
    setRating(value);
    rateResource({ resourceId, rating: value }, {
      onSuccess: () => toast.success("Thanks for rating!"),
      onError: () => {
        // Revert to original
        if (myRatingData?.data?.rating) {
          setRating(myRatingData.data.rating);
        } else {
          setRating(0);
        }
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={isPending}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-1 focus:outline-none transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Star
            size={28}
            className={`transition-colors ${
              (hover || rating) >= star
                ? "text-yellow-400 fill-yellow-400"
                : "text-slate-600"
            }`}
          />
        </button>
      ))}
      <span className="ml-3 text-sm text-slate-400 font-medium">
        {rating > 0 ? `You rated ${rating}/5` : "Click to rate"}
      </span>
    </div>
  );
};
