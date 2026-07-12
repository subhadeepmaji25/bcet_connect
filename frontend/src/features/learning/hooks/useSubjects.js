import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects.api";

export const subjectKeys = {
  all: ["subjects"],
  lists: () => [...subjectKeys.all, "list"],
  list: (filters) => [...subjectKeys.lists(), filters],
  mine: () => [...subjectKeys.all, "mine"],
  detail: (id) => [...subjectKeys.all, "detail", id],
};

export const useSubjectList = (filters) =>
  useQuery({
    queryKey: subjectKeys.list(filters),
    queryFn: () => subjectsApi.list(filters),
  });

export const useMySubjects = () =>
  useQuery({
    queryKey: subjectKeys.mine(),
    queryFn: () => subjectsApi.mine(),
  });

export const useSubjectDetail = (id) =>
  useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => subjectsApi.getById(id),
    enabled: !!id,
  });

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
      qc.invalidateQueries({ queryKey: subjectKeys.mine() });
    },
  });
};

export const useUpdateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => subjectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
      qc.invalidateQueries({ queryKey: subjectKeys.mine() });
      qc.invalidateQueries({ queryKey: subjectKeys.detail(id) });
    },
  });
};

export const useRemoveSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subjectsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
      qc.invalidateQueries({ queryKey: subjectKeys.mine() });
    },
  });
};
