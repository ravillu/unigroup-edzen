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

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If user is on Canvas setup page
  if (path === "/canvas") {
    // If user already has Canvas token or has skipped setup, redirect to home
    if (user.canvasToken || user.canvasSetupSkipped) {
      return (
        <Route path={path}>
          <Redirect to="/" />
        </Route>
      );
    }
  }

  // For protected routes that require Canvas setup
  if (requireCanvasSetup && !user.canvasToken && !user.canvasSetupSkipped && path !== "/canvas") {
    return (
      <Route path={path}>
        <Redirect to="/canvas" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}