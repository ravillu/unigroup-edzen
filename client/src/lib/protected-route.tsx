import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requireCanvasSetup = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireCanvasSetup?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If we're on the canvas page and either have token or skipped setup, redirect to home
  if (path === "/canvas" && (user.canvasToken || user.canvasSetupSkipped)) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // If we require Canvas setup and don't have it set up or skipped, redirect to canvas page
  if (requireCanvasSetup && !user.canvasToken && !user.canvasSetupSkipped && path !== "/canvas") {
    return (
      <Route path={path}>
        <Redirect to="/canvas" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}