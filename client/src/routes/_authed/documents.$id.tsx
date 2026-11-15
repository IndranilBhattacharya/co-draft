import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CollabEditor } from "@/components/editor/CollabEditor";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SidePanel } from "@/components/editor/SidePanel";
import { Message } from "@/components/Message";
import { useCollab } from "@/hooks/useCollab";
import { documentQuery } from "@/lib/api";
import { useRoom } from "@/store/room";

export const Route = createFileRoute("/_authed/documents/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(documentQuery(params.id)),
  errorComponent: () => (
    <Message title="This draft isn't available" body="It may have been deleted, or its share session ended." />
  ),
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  // key: a different id means a fresh Yjs doc and socket, not a reused one.
  return <DocumentRoom key={id} id={id} />;
}

function DocumentRoom({ id }: Readonly<{ id: string }>) {
  const { user } = Route.useRouteContext();
  const { data: doc } = useSuspenseQuery(documentQuery(id));
  const { ydoc, awareness, sendPointer } = useCollab(id, user.name);
  const status = useRoom((s) => s.status);
  const color = useRoom((s) => s.color);

  if (status === "ended") {
    return <Message title="This session has ended" body="The owner closed the share link." />;
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader doc={doc} ydoc={ydoc} />
      <div className="flex min-h-0 flex-1">
        <main className="flex-1 overflow-y-auto px-6">
          {/* Mount the editor once the first sync is done, so it starts with real content and a caret color. */}
          {color ? (
            <CollabEditor ydoc={ydoc} awareness={awareness} userName={user.name} sendPointer={sendPointer} />
          ) : (
            <p className="mt-24 text-center text-sm text-muted-foreground">Connecting…</p>
          )}
        </main>
        <SidePanel doc={doc} myId={user.id} />
      </div>
    </div>
  );
}
