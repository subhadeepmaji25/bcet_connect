import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { learningPathsApi } from "../api/learningPaths.api";

export const pathKeys = {
  all: ["paths"],
  lists: () => [...pathKeys.all, "list"],
  list: (filters) => [...pathKeys.lists(), filters],
  mine: (filters) => [...pathKeys.all, "mine", filters],
  detail: (id) => [...pathKeys.all, "detail", id],
  progress: (id) => [...pathKeys.all, "progress", id],
};

export const usePathList = (filters) =>
  useQuery({
    queryKey: pathKeys.list(filters),
    queryFn: () => learningPathsApi.list(filters),
  });

export const useMyPaths = (filters) =>
  useQuery({
    queryKey: pathKeys.mine(filters),
    queryFn: () => learningPathsApi.mine(filters),
  });

export const usePathDetail = (id) =>
  useQuery({
    queryKey: pathKeys.detail(id),
    queryFn: () => learningPathsApi.getById(id),
    enabled: !!id,
  });

export const useCreatePath = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningPathsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pathKeys.lists() });
      qc.invalidateQueries({ queryKey: pathKeys.mine({}) });
    },
  });
};

export const useUpdatePath = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => learningPathsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: pathKeys.detail(id) });
      qc.invalidateQueries({ queryKey: pathKeys.lists() });
      qc.invalidateQueries({ queryKey: pathKeys.mine({}) });
    },
  });
};

export const usePublishPath = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningPathsApi.publish,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: pathKeys.detail(id) });
      qc.invalidateQueries({ queryKey: pathKeys.lists() });
    },
  });
};

export const useEnrollPath = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: learningPathsApi.enroll,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: pathKeys.detail(id) });
      qc.invalidateQueries({ queryKey: pathKeys.progress(id) });
    },
  });
};

export const useUpdateStepProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, stepId, data }) => learningPathsApi.updateStepProgress(pathId, stepId, data),
    onSuccess: (_, { pathId }) => {
      qc.invalidateQueries({ queryKey: pathKeys.progress(pathId) });
    },
  });
};

export const useMyPathProgress = (id) =>
  useQuery({
    queryKey: pathKeys.progress(id),
    queryFn: () => learningPathsApi.getMyProgress(id),
    enabled: !!id,
  });
