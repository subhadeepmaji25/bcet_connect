import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { subjectDiscussionsApi } from "../api/subjectDiscussions.api";

export const discussionKeys = {
  all: ["discussions"],
  subject: (subjectId) => [...discussionKeys.all, "subject", subjectId],
  answers: (discussionId) => [...discussionKeys.all, "answers", discussionId],
};

export const useSubjectQuestions = (subjectId, filters) =>
  useInfiniteQuery({
    queryKey: [...discussionKeys.subject(subjectId), filters],
    queryFn: ({ pageParam }) => subjectDiscussionsApi.getQuestions(subjectId, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage?.data?.nextCursor || undefined,
    enabled: !!subjectId,
  });

export const useCreateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, data }) => subjectDiscussionsApi.createQuestion(subjectId, data),
    onSuccess: (_, { subjectId }) => {
      qc.invalidateQueries({ queryKey: discussionKeys.subject(subjectId) });
    },
  });
};

export const useDiscussionAnswers = (discussionId, filters) =>
  useInfiniteQuery({
    queryKey: [...discussionKeys.answers(discussionId), filters],
    queryFn: ({ pageParam }) => subjectDiscussionsApi.getAnswers(discussionId, { ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage?.data?.nextCursor || undefined,
    enabled: !!discussionId,
  });

// We can add togglePin, toggleLike, acceptAnswer mutations similarly here...
export const useToggleLikeDiscussion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subjectDiscussionsApi.toggleLike,
    // Note: To precisely invalidate, you'd need the subjectId or to invalidate all discussion keys loosely
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: discussionKeys.all });
    },
  });
};
