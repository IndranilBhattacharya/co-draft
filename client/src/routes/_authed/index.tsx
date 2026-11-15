import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUp, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { DocumentCard } from "@/components/DocumentCard";
import { Sidebar, TABS } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { api, documentsQuery } from "@/lib/api";

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
      (tab === "recent" || (tab === "mine") === (doc.role === "owner")) &&
      (doc.title.toLowerCase().includes(query) || doc.preview.toLowerCase().includes(query)),
  );

  return (
    <div className="flex h-screen">
      <Sidebar user={user} search={search} onSearch={setSearch} />

      <main className="flex-1 overflow-y-auto">
        <header className="flex h-14 items-center border-b px-6 text-sm font-medium">
          {TABS.find((t) => t.tab === tab)?.label}
        </header>

        <div className="p-6">
          <NewDraft />

          {visible.length === 0 ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              {tab === "shared" ? "Nothing shared with you right now." : "No drafts yet. Start one above."}
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-5">
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

function NewDraft() {
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: api.createDocument,
    onSuccess: ({ id }) => void navigate({ to: "/documents/$id", params: { id } }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create.mutate(String(new FormData(event.currentTarget).get("title") ?? ""));
  };

  return (
    <section className="rounded-xl border bg-card/40 p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        Start a draft and bring people in <Sparkles className="size-4 text-muted-foreground" />
      </h2>
      <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2 rounded-lg border bg-background/60 p-1.5 pl-3">
        <input
          name="title"
          maxLength={120}
          aria-label="Draft title"
          placeholder="Name it, or leave it blank and pick a title once you've written something"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button size="sm" disabled={create.isPending}>
          Create draft <ArrowUp />
        </Button>
      </form>
    </section>
  );
}
