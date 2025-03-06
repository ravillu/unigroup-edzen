import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import LandingPage from "@/pages/landing-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import FormBuilderPage from "@/pages/form-builder-page";
import FormResponsesPage from "@/pages/form-responses-page";
import StudentFormPage from "@/pages/student-form-page";
import GroupViewPage from "@/pages/group-view-page";
import CanvasIntegrationPage from "@/pages/canvas-integration-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forms/:id/submit" component={StudentFormPage} />
      <Route path="/forms/:id/groups" component={GroupViewPage} />

      {/* Protected routes that require Canvas setup */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} requireCanvasSetup={true} />
      <ProtectedRoute path="/forms/new" component={FormBuilderPage} requireCanvasSetup={true} />
      <ProtectedRoute path="/forms/:id/responses" component={FormResponsesPage} requireCanvasSetup={true} />

      {/* Canvas integration route - protected but doesn't require Canvas setup */}
      <ProtectedRoute path="/canvas" component={CanvasIntegrationPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;