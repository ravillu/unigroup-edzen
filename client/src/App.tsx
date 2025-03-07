import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { PageLayout } from "@/components/layout/page-layout";
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
      <Route path="/auth" component={AuthPage} />
      <Route path="/forms/:id/submit" component={StudentFormPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/forms/new" component={FormBuilderPage} />
      <ProtectedRoute path="/canvas" component={CanvasIntegrationPage} />
      <ProtectedRoute path="/forms/:id/responses" component={FormResponsesPage} />
      <ProtectedRoute path="/forms/:id/groups" component={GroupViewPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PageLayout> {/* Added PageLayout here */}
          <Router />
          <Toaster />
        </PageLayout> {/* Added PageLayout here */}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;