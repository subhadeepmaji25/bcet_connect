import { useInfiniteQuery } from "@tanstack/react-query";
import { feedApi } from "../../../api/feedApi";

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => feedApi.getFeed({ cursor: pageParam, limit: 15 }),
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor || undefined,
    initialPageParam: undefined
  });
};
