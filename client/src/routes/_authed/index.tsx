// / : the home page. Lists your drafts and the ones shared with you, with search,
// tabs, and a button to start a new draft.
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, Menu, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { DocumentCard } from "@/components/DocumentCard";
import { Sidebar, TABS } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { documents, documentsQuery } from "@/lib/graphql";

export const Route = createFileRoute("/_authed/")({
  // The active tab lives in the URL (?tab=shared): shareable, survives refresh, back button works.
  validateSearch: z.object({ tab: z.enum(["recent", "mine", "shared"]).optional().catch(undefined) }),
  // Start fetching before the component renders; the component then reads the warm cache.
  loader: ({ context }) => context.queryClient.ensureQueryData(documentsQuery),
  component: HomePage,
});

function HomePage() {
  const { user } = Route.useRouteContext();
  const { tab = "recent" } = Route.useSearch();
  const { data: docs } = useSuspenseQuery(documentsQuery);
  const [search, setSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const query = search.trim().toLowerCase();
  const visible = docs.filter(
    (doc) =>
      (tab === "recent" || (tab === "mine") === (doc.role === "OWNER")) &&
      (doc.title.toLowerCase().includes(query) || doc.preview.toLowerCase().includes(query)),
  );

  let emptyText = "No drafts yet. Create one to get started.";
  if (tab === "shared") emptyText = "Nothing shared with you right now.";
  if (query) emptyText = "No drafts match your search.";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Pinned Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar user={user} search={search} onSearch={setSearch} />
      </div>

      {/* Mobile Slide-over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
          {/* Drawer content */}
          <div className="relative flex h-full w-4/5 max-w-xs flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <Sidebar
              user={user}
              search={search}
              onSearch={setSearch}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Same height as the sidebar's top row, with responsive padding & menu trigger */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-md px-3 sm:px-6 md:px-8 sticky top-0 z-10 select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex md:hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <Menu className="size-4.5" />
            </button>
            <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">
              {TABS.find((t) => t.tab === tab)?.label}
            </h1>
          </div>
          <NewDraftButton />
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 sm:py-24 text-center">
              <span className="rounded-full bg-muted/80 p-3 ring-1 ring-border/50">
                <FileText className="size-5 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground max-w-xs">{emptyText}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {visible.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Creates an empty draft ("Untitled") and opens it. The title is edited inside the editor.
function NewDraftButton() {
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: () => documents.create(""),
    onSuccess: ({ id }) => void navigate({ to: "/documents/$id", params: { id } }),
  });

  return (
    <Button
      size="sm"
      onClick={() => create.mutate()}
      disabled={create.isPending}
      className="h-8 gap-1.5 px-2.5 sm:px-3 text-xs font-medium shrink-0 shadow-xs"
    >
      <Plus className="size-3.5" />
      <span>New draft</span>
    </Button>
  );
}
