import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { resourceEngagementApi } from "../api/resourceEngagement.api";
import { resourceKeys } from "./useResources";

export const engagementKeys = {
  all: ["engagement"],
  ratings: (resourceId) => [...engagementKeys.all, "ratings", resourceId],
  myRating: (resourceId) => [...engagementKeys.all, "myRating", resourceId],
  comments: (resourceId) => [...engagementKeys.all, "comments", resourceId],
  replies: (commentId) => [...engagementKeys.all, "replies", commentId],
};

export const useBookmarkResource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resourceEngagementApi.bookmark,
    // Optimistic update omitted here for simplicity, but backend returns updated status
    onSuccess: (data, resourceId) => {
      qc.invalidateQueries({ queryKey: resourceKeys.detail(resourceId) });
      qc.invalidateQueries({ queryKey: resourceKeys.bookmarks({}) });
    },
  });
};

export const useRateResource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, rating }) => resourceEngagementApi.rate(resourceId, rating),
    onSuccess: (_, { resourceId }) => {
      qc.invalidateQueries({ queryKey: engagementKeys.ratings(resourceId) });
      qc.invalidateQueries({ queryKey: engagementKeys.myRating(resourceId) });
      qc.invalidateQueries({ queryKey: resourceKeys.detail(resourceId) }); // refetch avgRating
    },
  });
};

export const useMyRating = (resourceId) =>
  useQuery({
    queryKey: engagementKeys.myRating(resourceId),
    queryFn: () => resourceEngagementApi.getMyRating(resourceId),
    enabled: !!resourceId,
  });

export const useResourceRatings = (resourceId, filters) =>
  useQuery({
    queryKey: [...engagementKeys.ratings(resourceId), filters],
    queryFn: () => resourceEngagementApi.getRatings(resourceId, filters),
    enabled: !!resourceId,
  });

export const useTrackDownload = () => {
  return useMutation({
    mutationFn: resourceEngagementApi.download,
    // Fire and forget
  });
};

// Comments use Infinite Query for cursor pagination
export const useCommentsInfinite = (resourceId, filters) =>
  useInfiniteQuery({
    queryKey: [...engagementKeys.comments(resourceId), filters],
    queryFn: ({ pageParam }) => resourceEngagementApi.getComments(resourceId, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage?.data?.nextCursor || undefined,
    enabled: !!resourceId,
  });

export const useCreateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, data }) => resourceEngagementApi.createComment(resourceId, data),
    onSuccess: (_, { resourceId }) => {
      qc.invalidateQueries({ queryKey: engagementKeys.comments(resourceId) });
    },
  });
};

export const useLikeComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resourceEngagementApi.likeComment,
    // Optimistic update could go here
    onSuccess: (_, commentId) => {
      // In a real app we would update the infinite cache surgically, 
      // but invalidating the whole resource's comments is simpler for now, 
      // though requires passing resourceId if we want to be exact.
      // We can just rely on the UI state for instant feedback.
    },
  });
};
