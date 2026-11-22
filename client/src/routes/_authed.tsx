import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { isLocallyAuthenticated, meQuery } from "@/lib/rest";

// Pathless layout route ("_" prefix): guards every route inside src/routes/_authed/.
export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => {
    // If the client has no record of a session on this device, immediately redirect to registration
    // without stalling on a sleeping/cold backend fetch.
    if (!isLocallyAuthenticated()) {
      throw redirect({ to: "/register", search: { redirect: location.href } });
    }

    const user = await context.queryClient.ensureQueryData(meQuery).catch(() => null);
    if (!user) {
      throw redirect({ to: "/register", search: { redirect: location.href } });
    }
    return { user }; // merged into the context of child routes
  },
  pendingComponent: () => <LoadingScreen message="Resuming workspace…" />,
});
