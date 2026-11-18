"use client";

import dynamic from "next/dynamic";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";

const MdxEditorInner = dynamic(() => import("./mdx-editor-inner"), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-full min-h-48 w-full rounded-lg" />
  ),
});

export interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  /** Clases del contenedor; permite fijar altura o hacer que el editor ocupe el espacio disponible. */
  className?: string;
  /** Hace que el editor llene la altura del contenedor y desplace su contenido internamente. */
  fill?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly,
  placeholder,
  className,
  fill,
}: MarkdownEditorProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <MdxEditorInner
        markdown={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        fill={fill}
      />
    </div>
  );
}
