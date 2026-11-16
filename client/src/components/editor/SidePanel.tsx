// Right column of the editor: who is here right now (from WebSocket presence),
// the live AI summary (from Server-Sent Events), formatting syntax cheat-sheet, and document details.
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Globe,
  Info,
  Keyboard,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { useSummary } from "@/hooks/useSummary";
import type { DocumentDetail } from "@/lib/graphql";
import { formatDate, formatTime } from "@/lib/utils";
import { useRoom } from "@/store/room";

const SHORTCUTS = [
  { syntax: "**bold**", label: "Bold" },
  { syntax: "*italic*", label: "Italic" },
  { syntax: "~~strike~~", label: "Strikethrough" },
  { syntax: "`code`", label: "Inline code" },
  { syntax: "```code```", label: "Code block" },
  { syntax: "# title", label: "Heading 1" },
  { syntax: "## title", label: "Heading 2" },
  { syntax: "- list", label: "Bullet list" },
  { syntax: "1. list", label: "Numbered list" },
  { syntax: "> quote", label: "Blockquote" },
  { syntax: "---", label: "Divider" },
];

export function SidePanel({ doc, myId }: Readonly<{ doc: DocumentDetail; myId: string }>) {
  const people = useRoom((s) => s.people);
  const summary = useSummary(doc.id);
  const [showAllShortcuts, setShowAllShortcuts] = useState(false);

  const visibleShortcuts = showAllShortcuts ? SHORTCUTS : SHORTCUTS.slice(0, 6);

  return (
    <aside className="no-print flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border/60 bg-card/20 p-5 text-sm backdrop-blur-sm select-none">
      {/* 1. Live Users / Presence Section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-muted-foreground" />
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Here now
            </h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {people.length} {people.length === 1 ? "user" : "users"}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {people.map((person) => {
            const isMe = person.id === myId;
            return (
              <li
                key={person.id}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/60 p-2.5 transition-colors hover:bg-accent/40 shadow-xs"
              >
                <div className="relative shrink-0">
                  <Avatar
                    seed={person.avatar}
                    className="size-8 rounded-full"
                    style={{ boxShadow: `0 0 0 2px ${person.color}` }}
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background"
                    style={{ backgroundColor: person.color }}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {person.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isMe ? "Current user (you)" : "Active collaborator"}
                  </span>
                </div>

                {isMe ? (
                  <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    You
                  </span>
                ) : (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: person.color }}
                    title={`Cursor color: ${person.color}`}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 2. Live AI Summary */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-3.5 text-amber-400" />
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Live summary
          </h2>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-xs">
          <p className="text-xs leading-relaxed text-foreground/90">
            {summary || (
              <span className="italic text-muted-foreground/70">
                A summary appears here as the draft takes shape.
              </span>
            )}
          </p>
        </div>
      </section>

      {/* 3. Markdown Formatting Guidelines */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="size-3.5 text-muted-foreground" />
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Formatting syntax
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAllShortcuts((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {showAllShortcuts ? (
              <>
                Less <ChevronUp className="size-3" />
              </>
            ) : (
              <>
                All ({SHORTCUTS.length}) <ChevronDown className="size-3" />
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs">
          <div className="flex flex-col gap-2">
            {visibleShortcuts.map((item) => (
              <div
                key={item.syntax}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <kbd className="rounded border border-border/60 bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                  {item.syntax}
                </kbd>
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Document Details */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Info className="size-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Details
          </h2>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-xs">
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-xs">
            <dt className="text-muted-foreground">Owner</dt>
            <dd className="flex items-center gap-1.5 truncate font-medium text-foreground">
              <Avatar seed={doc.owner.avatar} className="size-4 rounded-full" />
              <span className="truncate">{doc.owner.name}</span>
            </dd>

            <dt className="text-muted-foreground">Created</dt>
            <dd className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5 text-muted-foreground/70" />
              <span>{formatDate(doc.createdAt)}</span>
            </dd>

            <dt className="text-muted-foreground">Session</dt>
            <dd>
              {doc.share ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <Globe className="size-3" />
                  Live until {formatTime(doc.share.expiresAt)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Shield className="size-3" />
                  Private
                </span>
              )}
            </dd>
          </dl>
        </div>
      </section>
    </aside>
  );
}
