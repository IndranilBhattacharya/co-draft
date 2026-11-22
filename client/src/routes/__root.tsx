// The root route wraps every page. It also sets what to show for unknown URLs,
// pending transitions, and unexpected errors. `queryClient` in the context lets every loader use the data cache.
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { Message } from "@/components/Message";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  pendingComponent: () => <LoadingScreen />,
  notFoundComponent: () => <Message title="Page not found" />,
  errorComponent: ({ error }) => <Message title="Something went wrong" body={error instanceof Error ? error.message : undefined} />,
});
