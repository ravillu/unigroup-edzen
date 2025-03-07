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

  // If user has Canvas setup skipped, treat it as having Canvas integrated
  const hasCanvasSetup = user.canvasToken || user.canvasSetupSkipped;

  // Only redirect to Canvas setup if:
  // 1. The route requires Canvas setup
  // 2. User doesn't have Canvas token AND hasn't skipped setup
  // 3. Not already on the Canvas setup page
  if (requireCanvasSetup && !hasCanvasSetup && path !== "/canvas") {
    return (
      <Route path={path}>
        <Redirect to="/canvas" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}