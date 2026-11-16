// One draft on the home page: a mini page preview, title, last edit time,
// the owner's avatar if it was shared with you, and a delete button for your own drafts.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, Trash2 } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { documents, documentsQuery, type DocumentItem } from "@/lib/graphql";
import { timeAgo } from "@/lib/utils";

export function DocumentCard({ doc }: Readonly<{ doc: DocumentItem }>) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => documents.remove(doc.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQuery.queryKey }),
  });

  return (
    <div className="group relative min-w-0">
      <Link to="/documents/$id" params={{ id: doc.id }} className="block">
        {/* Thumbnail: the top of a white page, cropped by the rounded frame */}
        <div className="aspect-4/3 overflow-hidden rounded-xl border border-border/60 bg-neutral-900 transition-colors group-hover:border-foreground/30 shadow-xs">
          <div className="mx-auto mt-5 sm:mt-6 h-full w-[68%] sm:w-[58%] rounded-t-sm bg-white p-3 text-[5px] sm:text-[6px] leading-[8px] whitespace-pre-line text-neutral-700 shadow-lg select-none">
            <p className="mb-1 text-[7px] sm:text-[8px] font-semibold text-black truncate">{doc.title || "Untitled"}</p>
            <p className="line-clamp-6">{doc.preview}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5 px-0.5">
          <span className="rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/25 p-1.5 shrink-0">
            <FileText className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{doc.title || "Untitled"}</p>
            <p className="text-xs text-muted-foreground">Edited {timeAgo(doc.updatedAt)}</p>
          </div>
          {doc.role === "GUEST" && (
            <span title={`Shared by ${doc.owner.name}`} className="shrink-0">
              <Avatar seed={doc.owner.avatar} className="size-6 ring-1 ring-border/40 rounded-full" />
            </span>
          )}
        </div>
      </Link>

      {/* Outside the Link so clicking it doesn't open the draft. Only the owner can delete. */}
      {doc.role === "OWNER" && (
        <button
          type="button"
          aria-label={`Delete ${doc.title || "draft"}`}
          disabled={remove.isPending}
          onClick={() => confirm(`Delete "${doc.title || "Untitled"}"? This can't be undone.`) && remove.mutate()}
          className="absolute top-2 right-2 cursor-pointer rounded-lg bg-background/80 p-1.5 text-muted-foreground opacity-80 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 hover:text-red-400 focus-visible:opacity-100 shadow-xs"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
