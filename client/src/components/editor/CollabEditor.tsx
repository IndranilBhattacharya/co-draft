// The rich text editor (Tiptap). The Collaboration extension stores the text in the shared
// Yjs document, and CollaborationCaret draws other people's cursors in their colors.
// This component also sends our mouse position and draws everyone else's pointer.
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  HelpCircle,
  Italic,
  List,
  ListOrdered,
  Minus,
  MousePointer2,
  Quote,
  SquareCode,
  Strikethrough,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import { useSharedTitle } from "@/hooks/useCollab";
import { cn } from "@/lib/utils";
import { useRoom } from "@/store/room";

type CollabEditorProps = {
  ydoc: Y.Doc;
  awareness: Awareness;
  userName: string;
  sendPointer: (pos: { x: number; y: number } | null) => void;
};

export function CollabEditor({ ydoc, awareness, userName, sendPointer }: Readonly<CollabEditorProps>) {
  const color = useRoom((s) => s.color);
  const [title] = useSharedTitle(ydoc);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const lastSent = useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }), // Yjs brings its own collaborative undo
      Placeholder.configure({
        placeholder: "Start drafting… (type markdown like # for heading, - for list, or use toolbar above)",
      }),
      Collaboration.configure({ document: ydoc, field: "content" }),
      CollaborationCaret.configure({ provider: { awareness }, user: { name: userName, color } }),
    ],
    editorProps: {
      attributes: {
        class: "tiptap-content min-h-[65vh] outline-none",
        "aria-label": "Document",
      },
    },
  });

  // The server may hand out a new color after a reconnect.
  useEffect(() => {
    editor?.commands.updateUser({ name: userName, color });
  }, [editor, userName, color]);

  // Mouse position: x as a fraction of the page width (screens differ), y in px from the top.
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.timeStamp - lastSent.current < 40) return; // ~25 updates/s is plenty
    lastSent.current = event.timeStamp;
    const rect = event.currentTarget.getBoundingClientRect();
    sendPointer({ x: (event.clientX - rect.left) / rect.width, y: event.clientY - rect.top });
  };

  return (
    <>
      <div
        onPointerMove={onPointerMove}
        onPointerLeave={() => sendPointer(null)}
        className="editor-canvas-container relative mx-auto my-6 max-w-4xl rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-2xl transition-all"
      >
        {/* Document Title for PDF Print view only */}
        <h1 className="print-document-title hidden">{title || "Untitled Draft"}</h1>

        {/* Minimal Figma-style Editor Formatting Toolbar */}
        {editor && (
          <div className="no-print flex flex-wrap items-center justify-between gap-1 border-b border-border/40 bg-muted/20 px-4 py-2 select-none">
            <div className="flex flex-wrap items-center gap-0.5">
              <ToolbarButton
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold (**text**)"
              >
                <Bold className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic (*text*)"
              >
                <Italic className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="Strikethrough (~~text~~)"
              >
                <Strikethrough className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive("code")}
                onClick={() => editor.chain().focus().toggleCode().run()}
                title="Inline Code (`code`)"
              >
                <Code className="size-3.5" />
              </ToolbarButton>

              <div className="mx-1.5 h-4 w-px bg-border/60" />

              <ToolbarButton
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1 (# heading)"
              >
                <Heading1 className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2 (## heading)"
              >
                <Heading2 className="size-3.5" />
              </ToolbarButton>

              <div className="mx-1.5 h-4 w-px bg-border/60" />

              <ToolbarButton
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List (- list)"
              >
                <List className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Numbered List (1. list)"
              >
                <ListOrdered className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                title="Blockquote (> quote)"
              >
                <Quote className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive("codeBlock")}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                title="Code Block (```code)"
              >
                <SquareCode className="size-3.5" />
              </ToolbarButton>

              <ToolbarButton
                active={false}
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Divider (---)"
              >
                <Minus className="size-3.5" />
              </ToolbarButton>
            </div>

            {/* Quick Syntax Guide Popover Trigger */}
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-colors cursor-pointer"
              title="View all formatting shortcuts and markdown syntax"
            >
              <HelpCircle className="size-3.5 text-primary/80" />
              <span className="font-medium">Syntax guide</span>
            </button>
          </div>
        )}

        <div className="px-8 py-8 md:px-14 md:py-12">
          <EditorContent editor={editor} />
        </div>
        <RemotePointers />
      </div>

      {/* Formatting Guide Modal */}
      {showGuideModal && <FormattingGuideModal onClose={() => setShowGuideModal(false)} />}
    </>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground cursor-pointer",
        active && "bg-accent/80 text-foreground font-semibold ring-1 ring-border shadow-xs"
      )}
    >
      {children}
    </button>
  );
}

function RemotePointers() {
  const pointers = useRoom((s) => s.pointers);
  return Object.values(pointers).map((p) => (
    <div
      key={p.id}
      className="remote-pointer pointer-events-none absolute z-10 flex items-start transition-[left,top] duration-75 no-print"
      style={{ left: `${p.x * 100}%`, top: p.y }}
    >
      <MousePointer2 className="size-3.5 drop-shadow-md" style={{ color: p.color, fill: p.color }} />
      <span
        className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-black shadow-md select-none tracking-tight"
        style={{ backgroundColor: p.color }}
      >
        {p.name}
      </span>
    </div>
  ));
}

const FORMATTING_RULES = [
  { trigger: "**bold**", result: "Bold text", preview: "Bold" },
  { trigger: "*italic* or _italic_", result: "Italic text", preview: "Italic" },
  { trigger: "~~strikethrough~~", result: "Strikethrough text", preview: "Strike" },
  { trigger: "`code`", result: "Inline code snippet", preview: "code" },
  { trigger: "```code```", result: "Multi-line code block", preview: "Code Block" },
  { trigger: "# Title", result: "Heading 1 (Main Title)", preview: "H1" },
  { trigger: "## Subtitle", result: "Heading 2 (Section Title)", preview: "H2" },
  { trigger: "### Section", result: "Heading 3 (Sub-section)", preview: "H3" },
  { trigger: "- item or * item", result: "Bullet list", preview: "• List" },
  { trigger: "1. item", result: "Numbered list", preview: "1. List" },
  { trigger: "> quote", result: "Blockquote callout", preview: "“Quote”" },
  { trigger: "---", result: "Horizontal divider rule", preview: "Line" },
];

function FormattingGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/70 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Markdown & Formatting Guide</h3>
              <p className="text-xs text-muted-foreground">Type these markdown shortcuts directly while drafting</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            {FORMATTING_RULES.map((rule) => (
              <div
                key={rule.trigger}
                className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">{rule.result}</span>
                  <code className="text-[11px] font-mono text-muted-foreground font-semibold">{rule.trigger}</code>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-accent text-accent-foreground font-mono font-medium border border-border/60">
                  {rule.preview}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end pt-3 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
