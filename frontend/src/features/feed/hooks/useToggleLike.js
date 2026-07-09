import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedApi } from "../../../api/feedApi";

export const useToggleLike = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => feedApi.toggleLike(postId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  });
};
