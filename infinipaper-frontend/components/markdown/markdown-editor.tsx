"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MdxEditorInner = dynamic(() => import("./mdx-editor-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
});

export interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly,
  placeholder,
}: MarkdownEditorProps) {
  return (
    <MdxEditorInner
      markdown={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
    />
  );
}
