import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedApi } from "../../../api/feedApi";

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => feedApi.createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  });
};
