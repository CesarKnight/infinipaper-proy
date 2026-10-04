"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

export function useSession() {
  const query = useQuery<User | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await apiFetch<User>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
  });

  return { user: query.data ?? null, isLoading: query.isLoading };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(["session"], null);
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });
}
