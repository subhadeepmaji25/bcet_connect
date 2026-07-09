import { useInfiniteQuery } from "@tanstack/react-query";
import { feedApi } from "../../../api/feedApi";

export const useFeed = ({ scope = "feed", filters = {} } = {}) => {
  return useInfiniteQuery({
    queryKey: ["feed", scope, filters],
    queryFn: ({ pageParam }) => feedApi.getFeed({ cursor: pageParam, limit: 15, ...filters }),
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor || undefined,
    initialPageParam: undefined
  });
};
