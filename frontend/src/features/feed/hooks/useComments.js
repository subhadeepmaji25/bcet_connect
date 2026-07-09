import { useInfiniteQuery } from "@tanstack/react-query";
import { feedApi } from "../../../api/feedApi";

export const useComments = (postId) => {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam }) => feedApi.getComments(postId, { cursor: pageParam, limit: 15 }),
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor || undefined,
    initialPageParam: undefined,
    enabled: !!postId
  });
};
