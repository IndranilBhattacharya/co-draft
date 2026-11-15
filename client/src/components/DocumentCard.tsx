import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, Trash2 } from "lucide-react";

import { api, documentsQuery, type DocumentItem } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

export function DocumentCard({ doc }: Readonly<{ doc: DocumentItem }>) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => api.deleteDocument(doc.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQuery.queryKey }),
  });

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card/40 transition-colors hover:border-foreground/25">
      <Link to="/documents/$id" params={{ id: doc.id }} className="block">
        {/* Thumbnail: a tiny white page with the first lines of text */}
        <div className="flex h-40 justify-center overflow-hidden bg-neutral-900 pt-5">
          <div className="w-32 rounded-sm bg-white p-2.5 text-[5px] leading-[7px] whitespace-pre-line text-neutral-700 shadow-lg">
            <p className="mb-1 text-[7px] font-semibold text-black">{doc.title}</p>
            {doc.preview}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t p-3">
          <span className="rounded bg-sky-500 p-1 text-white">
            <FileText className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{doc.title}</p>
            <p className="text-xs text-muted-foreground">Edited {timeAgo(doc.updatedAt)}</p>
          </div>
          {doc.role === "guest" && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">Shared</span>
          )}
        </div>
      </Link>

      {doc.role === "owner" && (
        <button
          type="button"
          aria-label={`Delete ${doc.title}`}
          disabled={remove.isPending}
          onClick={() => confirm(`Delete "${doc.title}"? This can't be undone.`) && remove.mutate()}
          className="absolute top-2 right-2 cursor-pointer rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 focus-visible:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
