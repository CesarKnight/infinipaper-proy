"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { GenerationQueueResponse } from "@/lib/types";

export function useGenerationQueue(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["generation-queue", projectId],
    queryFn: () =>
      apiFetch<GenerationQueueResponse>(
        `/projects/${projectId}/generation-jobs?active=true&limit=20`,
      ),
    enabled,
    refetchInterval: 3000,
    staleTime: 1000,
  });
}
