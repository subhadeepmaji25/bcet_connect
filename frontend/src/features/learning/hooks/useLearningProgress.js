import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { learningProgressApi } from "../api/learningProgress.api";

export const progressKeys = {
  all: ["progress"],
  mine: (resourceId) => [...progressKeys.all, "mine", resourceId],
  stats: (resourceId) => [...progressKeys.all, "stats", resourceId],
};

export const useMarkOpened = () => {
  return useMutation({
    mutationFn: learningProgressApi.markOpened,
    // fire and forget usually
  });
};

export const useUpdateProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, data }) => learningProgressApi.updateProgress(resourceId, data),
    onSuccess: (_, { resourceId }) => {
      qc.invalidateQueries({ queryKey: progressKeys.mine(resourceId) });
    },
  });
};

export const useMyProgress = (resourceId) =>
  useQuery({
    queryKey: progressKeys.mine(resourceId),
    queryFn: () => learningProgressApi.getMyProgress(resourceId),
    enabled: !!resourceId,
  });

export const useProgressStats = (resourceId) =>
  useQuery({
    queryKey: progressKeys.stats(resourceId),
    queryFn: () => learningProgressApi.getStats(resourceId),
    enabled: !!resourceId,
  });
