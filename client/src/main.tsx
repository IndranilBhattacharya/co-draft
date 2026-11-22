// App entry: creates the data cache and the router, then renders the app into index.html.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { LoadingScreen } from "./components/ui/LoadingScreen";
import "./index.css";
import { routeTree } from "./routeTree.gen"; // generated from src/routes by the Vite plugin

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient }, // available in every route's beforeLoad/loader
  defaultPreload: "intent", // hovering a link starts loading its route + data
  defaultPreloadStaleTime: 0, // let TanStack Query decide freshness, not the router
  defaultPendingComponent: () => <LoadingScreen />,
});

// Makes <Link to="..."> and useParams fully type-safe across the app.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
