// Top bar of the editor: back button, shared title, "Suggest title" (gRPC),
// connection status, and the owner's share controls (GraphQL mutations).
import { ConnectError } from "@connectrpc/connect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Link2, Type } from "lucide-react";
import { useState } from "react";
import type * as Y from "yjs";

import { Button } from "@/components/ui/button";
import { useSharedTitle } from "@/hooks/useCollab";
import { documentQuery, documents, type DocumentDetail } from "@/lib/graphql";
import { titles } from "@/lib/rpc";
import { cn, formatTime } from "@/lib/utils";
import { useRoom, type Status } from "@/store/room";

const STATUS: Record<Status, { label: string; dot: string }> = {
  connecting: { label: "Connecting", dot: "bg-amber-400" },
  live: { label: "Live", dot: "bg-emerald-400" },
  offline: { label: "Reconnecting", dot: "bg-red-400" },
  ended: { label: "Ended", dot: "bg-neutral-500" },
};

export function EditorHeader({ doc, ydoc }: Readonly<{ doc: DocumentDetail; ydoc: Y.Doc }>) {
  const [title, setTitle] = useSharedTitle(ydoc);
  const status = STATUS[useRoom((s) => s.status)];

  // gRPC call. The new title comes back to every editor through the shared Yjs doc.
  const suggest = useMutation({ mutationFn: () => titles.suggestTitle({ documentId: doc.id }) });
  const suggestError = suggest.error instanceof ConnectError ? suggest.error.rawMessage : suggest.error?.message;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <Link to="/" aria-label="Back to drafts" className="rounded p-1.5 text-muted-foreground hover:bg-accent">
        <ArrowLeft className="size-4" />
      </Link>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        aria-label="Title"
        maxLength={120}
        className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
      />

      {suggestError && <span className="text-xs text-red-400">{suggestError}</span>}
      <Button variant="ghost" size="sm" onClick={() => suggest.mutate()} disabled={suggest.isPending}>
        <Type /> Suggest title
      </Button>

      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("size-2 rounded-full", status.dot)} /> {status.label}
      </span>

      {doc.role === "OWNER" && <ShareControls doc={doc} />}
    </header>
  );
}

function ShareControls({ doc }: Readonly<{ doc: DocumentDetail }>) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: documentQuery(doc.id).queryKey });

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(`${location.origin}/join/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const start = useMutation({
    mutationFn: () => documents.startShare(doc.id),
    onSuccess: async ({ token }) => {
      await refresh();
      await copy(token).catch(() => {}); // clipboard may need a fresh click; the Copy button covers it
    },
  });
  const end = useMutation({ mutationFn: () => documents.endShare(doc.id), onSuccess: refresh });

  const token = doc.share?.token;
  if (!doc.share || !token) {
    return (
      <Button size="sm" onClick={() => start.mutate()} disabled={start.isPending}>
        <Link2 /> Share
      </Button>
    );
  }

  return (
    <>
      <span className="hidden text-xs text-muted-foreground lg:inline">Link live until {formatTime(doc.share.expiresAt)}</span>
      <Button size="sm" variant="secondary" onClick={() => copy(token)}>
        <Copy /> {copied ? "Copied!" : "Copy link"}
      </Button>
      <Button size="sm" variant="destructive" onClick={() => end.mutate()} disabled={end.isPending}>
        End session
      </Button>
    </>
  );
}
