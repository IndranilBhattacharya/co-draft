// Left column of the home page: your profile and sign out, search box, and the tabs
// (Recents / My drafts / Shared with me). The active tab is kept in the URL as ?tab=.
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Clock, FileText, LogOut, Search, Users, X } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { auth, type User } from "@/lib/rest";
import { cn } from "@/lib/utils";

type Tab = "recent" | "mine" | "shared";

// eslint-disable-next-line react-refresh/only-export-components -- shared with the page header
export const TABS: { tab: Tab; label: string; icon: typeof Clock }[] = [
  { tab: "recent", label: "Recents", icon: Clock },
  { tab: "mine", label: "My drafts", icon: FileText },
  { tab: "shared", label: "Shared with me", icon: Users },
];

type SidebarProps = {
  user: User;
  search: string;
  onSearch: (value: string) => void;
  onClose?: () => void;
  className?: string;
};

export function Sidebar({ user, search, onSearch, onClose, className }: Readonly<SidebarProps>) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    if (!confirm("Sign out? There's no password, so this device can't sign back into this account.")) return;
    await auth.logout();
    queryClient.clear(); // drop every cached query from this user
    void navigate({ to: "/register" });
  };

  return (
    <aside className={cn("flex w-full md:w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/95 backdrop-blur-md h-full select-none", className)}>
      {/* Same height as the page header, so the two borders line up. */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-4">
        <Avatar seed={user.avatar} className="size-6 shrink-0 ring-1 ring-border/50 rounded-full" />
        <span className="flex-1 truncate text-sm font-medium text-foreground">{user.name}</span>
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <label className="relative mx-3 mt-3 block">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search drafts…"
          className="pl-8 h-9 text-xs sm:text-sm bg-background/50 border-border/60 focus:border-primary/80"
        />
      </label>

      <nav className="mt-4 flex flex-col gap-1 px-3">
        {TABS.map(({ tab, label, icon: Icon }) => (
          <Link
            key={tab}
            to="/"
            search={{ tab }}
            onClick={() => onClose?.()}
            activeOptions={{ includeSearch: true }}
            className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs sm:text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            activeProps={{ className: "bg-accent/80 font-medium text-foreground shadow-xs" }}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-border/60 px-4 py-3 text-base font-bold flex items-center justify-between">
        <span className="tracking-tight">
          <span className="bg-gradient-to-r from-gray-200 to-gray-500 bg-clip-text text-transparent">Co</span>Draft
        </span>
        <span className="text-[10px] text-muted-foreground/60 font-normal">v1.0</span>
      </div>
    </aside>
  );
}
