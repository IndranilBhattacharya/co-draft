// Left column of the home page: your profile and sign out, search box, and the tabs
// (Recents / My drafts / Shared with me). The active tab is kept in the URL as ?tab=.
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Clock, FileText, LogOut, Search, Users } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { auth, type User } from "@/lib/rest";

type Tab = "recent" | "mine" | "shared";

// eslint-disable-next-line react-refresh/only-export-components -- shared with the page header
export const TABS: { tab: Tab; label: string; icon: typeof Clock }[] = [
  { tab: "recent", label: "Recents", icon: Clock },
  { tab: "mine", label: "My drafts", icon: FileText },
  { tab: "shared", label: "Shared with me", icon: Users },
];

type SidebarProps = { user: User; search: string; onSearch: (value: string) => void };

export function Sidebar({ user, search, onSearch }: Readonly<SidebarProps>) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    if (!confirm("Sign out? There's no password, so this device can't sign back into this account.")) return;
    await auth.logout();
    queryClient.clear(); // drop every cached query from this user
    void navigate({ to: "/register" });
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      {/* Same height as the page header, so the two borders line up. */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <Avatar seed={user.avatar} className="size-6" />
        <span className="flex-1 truncate text-sm font-medium">{user.name}</span>
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          className="cursor-pointer rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <label className="relative mx-3 mt-3 block">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search" className="pl-8" />
      </label>

      <nav className="mt-4 flex flex-col gap-0.5 px-3">
        {TABS.map(({ tab, label, icon: Icon }) => (
          <Link
            key={tab}
            to="/"
            search={{ tab }}
            activeOptions={{ includeSearch: true }}
            className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            activeProps={{ className: "bg-accent font-medium text-foreground" }}
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t px-4 py-3 text-lg font-bold">
        <span className="bg-linear-to-r from-gray-300 to-gray-700 bg-clip-text text-transparent">Co</span>Draft
      </div>
    </aside>
  );
}
