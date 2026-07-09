import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedApi } from "../../../api/feedApi";
import { useAuth } from "../../../hooks/useAuth";

export const useToggleLike = (postId) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => feedApi.toggleLike(postId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previous = queryClient.getQueryData(["feed"]);

      queryClient.setQueryData(["feed"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              posts: page.data.posts.map((p) => {
                if (p._id === postId) {
                  const likedByMe = p.likedBy?.some((id) => id === user?.id || id === user?._id);
                  return { 
                    ...p, 
                    likeCount: Math.max(0, p.likeCount + (likedByMe ? -1 : 1)), 
                    likedBy: likedByMe 
                      ? (p.likedBy || []).filter(id => id !== user?.id && id !== user?._id) 
                      : [...(p.likedBy || []), user?._id || user?.id]
                  };
                }
                return p;
              })
            }
          }))
        };
      });

      return { previous };
    },

    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["feed"], context.previous);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed"] })
  });
};
