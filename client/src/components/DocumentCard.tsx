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
    <div className="group relative">
      <Link to="/documents/$id" params={{ id: doc.id }} className="block">
        {/* Thumbnail: the top of a white page, cropped by the rounded frame */}
        <div className="aspect-4/3 overflow-hidden rounded-lg border bg-neutral-900 transition-colors group-hover:border-foreground/30">
          <div className="mx-auto mt-6 h-full w-[58%] rounded-t-sm bg-white p-3 text-[5px] leading-[7px] whitespace-pre-line text-neutral-700 shadow-lg">
            <p className="mb-1 text-[7px] font-semibold text-black">{doc.title}</p>
            {doc.preview}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5 px-0.5">
          <span className="rounded bg-sky-500 p-1 text-white">
            <FileText className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{doc.title}</p>
            <p className="text-xs text-muted-foreground">Edited {timeAgo(doc.updatedAt)}</p>
          </div>
          {doc.role === "GUEST" && (
            <span title={`Shared by ${doc.owner.name}`} className="shrink-0">
              <Avatar seed={doc.owner.avatar} className="size-6" />
            </span>
          )}
        </div>
      </Link>

      {/* Outside the Link so clicking it doesn't open the draft. Only the owner can delete. */}
      {doc.role === "OWNER" && (
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
