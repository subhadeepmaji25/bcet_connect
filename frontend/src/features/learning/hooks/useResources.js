import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourcesApi } from "../api/resources.api";

export const resourceKeys = {
  all: ["resources"],
  lists: () => [...resourceKeys.all, "list"],
  list: (filters) => [...resourceKeys.lists(), filters],
  mine: (filters) => [...resourceKeys.all, "mine", filters],
  pending: (filters) => [...resourceKeys.all, "pending", filters],
  bookmarks: (filters) => [...resourceKeys.all, "bookmarks", filters],
  continueLearning: (filters) => [...resourceKeys.all, "continueLearning", filters],
  detail: (id) => [...resourceKeys.all, "detail", id],
};

// These use standard page-based pagination unless specified
export const useResourceList = (filters) =>
  useQuery({
    queryKey: resourceKeys.list(filters),
    queryFn: () => resourcesApi.list(filters),
  });

export const useMyUploads = (filters) =>
  useQuery({
    queryKey: resourceKeys.mine(filters),
    queryFn: () => resourcesApi.mine(filters),
  });

export const usePendingResources = (filters) =>
  useQuery({
    queryKey: resourceKeys.pending(filters),
    queryFn: () => resourcesApi.pending(filters),
  });

// Bookmarks is cursor-based paginated, we could use useInfiniteQuery, but for now simple query with page/cursor wrapper
export const useMyBookmarks = (filters) =>
  useQuery({
    queryKey: resourceKeys.bookmarks(filters),
    queryFn: () => resourcesApi.bookmarks(filters),
  });

export const useContinueLearning = (filters) =>
  useQuery({
    queryKey: resourceKeys.continueLearning(filters),
    queryFn: () => resourcesApi.continueLearning(filters),
  });

export const useResourceDetail = (id) =>
  useQuery({
    queryKey: resourceKeys.detail(id),
    queryFn: () => resourcesApi.getById(id),
    enabled: !!id,
  });

export const useUploadResource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resourcesApi.upload,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      qc.invalidateQueries({ queryKey: resourceKeys.mine({}) }); // clear mine cache
    },
  });
};

export const useVerifyResource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resourcesApi.verify,
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: resourceKeys.pending({}) });
      qc.invalidateQueries({ queryKey: resourceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
    },
  });
};

export const useRemoveResource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resourcesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      qc.invalidateQueries({ queryKey: resourceKeys.mine({}) });
    },
  });
};
