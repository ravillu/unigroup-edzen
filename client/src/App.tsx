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
      <ProtectedRoute path="/dashboard" component={DashboardPage} requireCanvasSetup={true} />
      <ProtectedRoute path="/forms/new" component={FormBuilderPage} requireCanvasSetup={true} />
      <ProtectedRoute path="/canvas" component={CanvasIntegrationPage} />
      <Route path="/forms/:id/responses" component={FormResponsesPage} />
      <Route path="/forms/:id/submit" component={StudentFormPage} />
      <Route path="/forms/:id/groups" component={GroupViewPage} />
      <Route path="/auth" component={AuthPage} />
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