import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { Message } from "@/components/Message";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: () => <Message title="Page not found" />,
  errorComponent: ({ error }) => <Message title="Something went wrong" body={error instanceof Error ? error.message : undefined} />,
});
