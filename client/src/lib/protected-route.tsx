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

  // If user already has Canvas token and tries to access Canvas setup, redirect to home
  if (path === "/canvas" && user.canvasToken) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Only redirect to Canvas setup if:
  // 1. Canvas setup is required for this route
  // 2. User doesn't have Canvas token
  // 3. User hasn't explicitly skipped setup
  // 4. Not already on the Canvas setup page
  if (requireCanvasSetup && !user.canvasToken && !user.canvasSetupSkipped && path !== "/canvas") {
    return (
      <Route path={path}>
        <Redirect to="/canvas" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}