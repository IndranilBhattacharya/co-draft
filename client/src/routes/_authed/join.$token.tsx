import { createFileRoute, redirect } from "@tanstack/react-router";

import { Message } from "@/components/Message";
import { api } from "@/lib/api";

// /join/<token>: the share link. Joins the session, then jumps into the editor.
export const Route = createFileRoute("/_authed/join/$token")({
  loader: async ({ params }) => {
    const { id } = await api.join(params.token);
    throw redirect({ to: "/documents/$id", params: { id }, replace: true });
  },
  errorComponent: () => <Message title="This link has expired" body="Ask the owner to share a fresh one." />,
});
