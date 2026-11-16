// / : the home page. Lists your drafts and the ones shared with you, with search,
// tabs, and a button to start a new draft.
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
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
    <div className="flex h-screen">
      <Sidebar user={user} search={search} onSearch={setSearch} />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Same height as the sidebar's top row, so the two borders line up. */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-8">
          <h1 className="text-sm font-medium">{TABS.find((t) => t.tab === tab)?.label}</h1>
          <NewDraftButton />
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <span className="rounded-full bg-muted p-3">
                <FileText className="size-5 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground">{emptyText}</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-x-5 gap-y-8">
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
    <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
      <Plus /> New draft
    </Button>
  );
}
