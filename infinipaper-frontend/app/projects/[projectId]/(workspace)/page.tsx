"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { NoticePanel } from "@/components/project/notice-panel";
import { ResourceList } from "@/components/project/resource-list";
import { useWorkspace } from "@/components/project/workspace-context";

export default function FolderWorkspacePage() {
  const { projectId, selectedFolderId, canEdit, isPending } = useWorkspace();

  if (isPending || !selectedFolderId) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <>
      <NoticePanel folderId={selectedFolderId} canEdit={canEdit} />
      <ResourceList
        projectId={projectId}
        folderId={selectedFolderId}
        canEdit={canEdit}
      />
    </>
  );
}
