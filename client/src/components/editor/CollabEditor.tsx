import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MousePointer2 } from "lucide-react";
import { useEffect, useRef, type PointerEvent } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import { useRoom } from "@/store/room";

type CollabEditorProps = {
  ydoc: Y.Doc;
  awareness: Awareness;
  userName: string;
  sendPointer: (pos: { x: number; y: number } | null) => void;
};

export function CollabEditor({ ydoc, awareness, userName, sendPointer }: Readonly<CollabEditorProps>) {
  const color = useRoom((s) => s.color);
  const lastSent = useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }), // Yjs brings its own collaborative undo
      Placeholder.configure({ placeholder: "Start drafting…  (# heading, - list, > quote, **bold**)" }),
      Collaboration.configure({ document: ydoc, field: "content" }),
      CollaborationCaret.configure({ provider: { awareness }, user: { name: userName, color } }),
    ],
    editorProps: { attributes: { class: "tiptap-content min-h-[60vh] outline-none", "aria-label": "Document" } },
  });

  // The server may hand out a new color after a reconnect.
  useEffect(() => {
    editor.commands.updateUser({ name: userName, color });
  }, [editor, userName, color]);

  // Mouse position: x as a fraction of the page width (screens differ), y in px from the top.
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.timeStamp - lastSent.current < 40) return; // ~25 updates/s is plenty
    lastSent.current = event.timeStamp;
    const rect = event.currentTarget.getBoundingClientRect();
    sendPointer({ x: (event.clientX - rect.left) / rect.width, y: event.clientY - rect.top });
  };

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerLeave={() => sendPointer(null)}
      className="relative mx-auto my-8 max-w-3xl rounded-xl border bg-card/60 px-14 py-12 shadow-2xl"
    >
      <EditorContent editor={editor} />
      <RemotePointers />
    </div>
  );
}

function RemotePointers() {
  const pointers = useRoom((s) => s.pointers);
  return Object.values(pointers).map((p) => (
    <div
      key={p.id}
      className="pointer-events-none absolute z-10 flex items-start transition-[left,top] duration-75"
      style={{ left: `${p.x * 100}%`, top: p.y }}
    >
      <MousePointer2 className="size-4" style={{ color: p.color, fill: p.color }} />
      <span className="mt-3 rounded px-1.5 py-0.5 text-[10px] font-medium text-black" style={{ background: p.color }}>
        {p.name}
      </span>
    </div>
  ));
}
