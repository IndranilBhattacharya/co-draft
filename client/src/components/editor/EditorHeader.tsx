// Top bar of the editor: back button, shared title, "Suggest title" (gRPC),
// live collaborators facepile, connection status, PDF export, and owner share controls.
import { ConnectError } from "@connectrpc/connect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Copy, Download, FileText, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import type * as Y from "yjs";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useSharedTitle } from "@/hooks/useCollab";
import { exportToPdf } from "@/lib/export";
import { documentQuery, documents, type DocumentDetail } from "@/lib/graphql";
import { titles } from "@/lib/rpc";
import { cn, formatTime } from "@/lib/utils";
import { useRoom, type Status } from "@/store/room";

const STATUS: Record<
  Status,
  { label: string; dot: string; pill: string; pulse?: boolean }
> = {
  connecting: {
    label: "Connecting",
    dot: "bg-amber-400",
    pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  live: {
    label: "Live",
    dot: "bg-emerald-400",
    pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pulse: true,
  },
  offline: {
    label: "Reconnecting",
    dot: "bg-red-400",
    pill: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  ended: {
    label: "Ended",
    dot: "bg-neutral-500",
    pill: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  },
};

export function EditorHeader({ doc, ydoc }: Readonly<{ doc: DocumentDetail; ydoc: Y.Doc }>) {
  const [title, setTitle] = useSharedTitle(ydoc);
  const status = STATUS[useRoom((s) => s.status)];
  const people = useRoom((s) => s.people);

  // gRPC call. The new title comes back to every editor through the shared Yjs doc.
  const suggest = useMutation({ mutationFn: () => titles.suggestTitle({ documentId: doc.id }) });
  const suggestError = suggest.error instanceof ConnectError ? suggest.error.rawMessage : suggest.error?.message;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sticky top-0 z-20 select-none">
      {/* Left: Back button & Title input */}
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <Link
          to="/"
          aria-label="Back to drafts"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground/70 hidden sm:block" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            aria-label="Title"
            maxLength={120}
            className="min-w-0 max-w-xs md:max-w-md flex-1 rounded-md bg-transparent px-2 py-1 text-sm md:text-base font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors hover:bg-accent/40 focus:bg-accent/60 focus:ring-1 focus:ring-ring/40"
          />
        </div>
      </div>

      {/* Right: Actions, Live Presence, Status & Share */}
      <div className="flex items-center gap-2 shrink-0">
        {suggestError && <span className="hidden sm:inline text-xs text-red-400">{suggestError}</span>}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => suggest.mutate()}
          disabled={suggest.isPending}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-foreground hover:bg-accent/80"
          title="Suggest an AI title based on draft content"
        >
          <Sparkles className="size-3.5 text-amber-400" />
          <span className="hidden sm:inline">{suggest.isPending ? "Suggesting…" : "Suggest title"}</span>
        </Button>

        {/* Live Facepile / Collaborators preview in header */}
        {people.length > 0 && (
          <div className="hidden lg:flex items-center -space-x-1.5 pl-1 pr-2">
            {people.slice(0, 3).map((person) => (
              <div
                key={person.id}
                title={person.name}
                className="relative inline-block rounded-full ring-2 ring-background transition-transform hover:scale-110 hover:z-10"
              >
                <Avatar seed={person.avatar} className="size-6 rounded-full" />
                <span
                  className="absolute bottom-0 right-0 size-1.5 rounded-full ring-1 ring-background"
                  style={{ backgroundColor: person.color }}
                />
              </div>
            ))}
            {people.length > 3 && (
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
                +{people.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Live status badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            status.pill
          )}
        >
          <span className={cn("size-2 rounded-full", status.dot, status.pulse && "animate-pulse")} />
          <span className="text-[11px] leading-none">{status.label}</span>
        </div>

        {/* Export PDF Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToPdf(title)}
          className="h-8 gap-1.5 px-3 text-xs font-medium hover:bg-accent hover:text-foreground transition-all"
          title="Export this draft to clean vector PDF"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>

        {/* Share controls for owner */}
        {doc.role === "OWNER" && <ShareControls doc={doc} />}
      </div>
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
      await copy(token).catch(() => {});
    },
  });
  const end = useMutation({ mutationFn: () => documents.endShare(doc.id), onSuccess: refresh });

  const token = doc.share?.token;
  if (!doc.share || !token) {
    return (
      <Button
        size="sm"
        onClick={() => start.mutate()}
        disabled={start.isPending}
        className="h-8 gap-1.5 px-3 text-xs font-medium"
      >
        <Share2 className="size-3.5" /> Share
      </Button>
    );
  }

  return (
    <>
      <span className="hidden xl:inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" /> Live until {formatTime(doc.share.expiresAt)}
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => copy(token)}
        className="h-8 gap-1.5 px-3 text-xs font-medium"
      >
        <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy link"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => end.mutate()}
        disabled={end.isPending}
        className="h-8 px-2.5 text-xs font-medium"
      >
        End session
      </Button>
    </>
  );
}
