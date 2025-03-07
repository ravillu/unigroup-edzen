import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function CanvasIntegrationPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const { user } = useAuth();

  // If user already has Canvas setup skipped, redirect to home
  useEffect(() => {
    if (user?.canvasSetupSkipped) {
      window.location.href = "/";
    }
  }, [user]);

  const skipCanvasMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/user/skip-canvas");
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to skip Canvas integration" }));
        throw new Error(error.message || "Failed to skip Canvas integration");
      }
      return res.json();
    },
    onSuccess: () => {
      // Simple approach: Just redirect to home
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b fixed top-0 left-0 right-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-[#C41230] cursor-pointer">
              UniGroup
            </h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Canvas Integration</CardTitle>
              <CardDescription>
                Choose how you want to manage your courses and student groups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Connect with Canvas (Recommended)</h3>
                <p className="text-muted-foreground">
                  By connecting with Canvas, you can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Automatically import your courses and students</li>
                  <li>Create assignments that appear in Canvas</li>
                  <li>Track student submissions directly</li>
                </ul>
                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={skipCanvasMutation.isPending}
                >
                  Set Up Canvas Integration
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Skip Canvas Integration</h3>
                <p className="text-muted-foreground">
                  You can still use the platform without Canvas integration:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Create surveys manually</li>
                  <li>Share survey links directly with students</li>
                  <li>Manage groups independently</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Note: You can always set up Canvas integration later from your dashboard.
                </p>
                <Button
                  variant="outline"
                  onClick={() => skipCanvasMutation.mutate()}
                  disabled={skipCanvasMutation.isPending}
                  className="w-full"
                >
                  {skipCanvasMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Skipping...
                    </>
                  ) : (
                    "Skip for Now"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}