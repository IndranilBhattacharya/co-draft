import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQuery } from "@/lib/rest";

// Pathless layout route ("_" prefix): guards every route inside src/routes/_authed/.
export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(meQuery).catch(() => null);
    if (!user) throw redirect({ to: "/register", search: { redirect: location.href } });
    return { user }; // merged into the context of child routes
  },
});
