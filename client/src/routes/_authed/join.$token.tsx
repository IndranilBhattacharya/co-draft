import { createFileRoute, redirect } from "@tanstack/react-router";

import { Message } from "@/components/Message";
import { documents } from "@/lib/graphql";

// /join/<token>: the share link. Joins the session, then jumps into the editor.
export const Route = createFileRoute("/_authed/join/$token")({
  loader: async ({ params }) => {
    const { id } = await documents.join(params.token);
    throw redirect({ to: "/documents/$id", params: { id }, replace: true });
  },
  errorComponent: () => <Message title="This link has expired" body="Ask the owner to share a fresh one." />,
});
