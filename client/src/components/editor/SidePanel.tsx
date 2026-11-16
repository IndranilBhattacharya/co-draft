// Right column of the editor: who is here right now (from the WebSocket),
// the live summary (from Server-Sent Events) and the document details (from GraphQL).
import type { ReactNode } from "react";

import { Avatar } from "@/components/Avatar";
import { useSummary } from "@/hooks/useSummary";
import type { DocumentDetail } from "@/lib/graphql";
import { formatDate, formatTime } from "@/lib/utils";
import { useRoom } from "@/store/room";

export function SidePanel({ doc, myId }: Readonly<{ doc: DocumentDetail; myId: string }>) {
  const people = useRoom((s) => s.people);
  const summary = useSummary(doc.id);

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-7 overflow-y-auto border-l p-5 text-sm">
      <Section title={`Here now · ${people.length}`}>
        <ul className="flex flex-col gap-2.5">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-2.5">
              <Avatar seed={person.avatar} className="size-7" style={{ boxShadow: `0 0 0 2px ${person.color}` }} />
              <span className="truncate">
                {person.name}
                {person.id === myId && <span className="text-muted-foreground"> (you)</span>}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Live summary">
        <p className="leading-relaxed text-muted-foreground">
          {summary || "A summary appears here as the draft takes shape."}
        </p>
      </Section>

      <Section title="Details">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="flex items-center gap-1.5 truncate">
            <Avatar seed={doc.owner.avatar} className="size-4" /> {doc.owner.name}
          </dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDate(doc.createdAt)}</dd>
          <dt className="text-muted-foreground">Session</dt>
          <dd>{doc.share ? `Open until ${formatTime(doc.share.expiresAt)}` : "Private"}</dd>
        </dl>
      </Section>
    </aside>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}
