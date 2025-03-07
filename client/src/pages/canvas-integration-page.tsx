import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const canvasSetupSchema = z.object({
  canvasInstanceUrl: z.string()
    .url("Please enter a valid Canvas URL")
    .refine(url => {
      // Basic validation for Canvas URL format
      return url.includes('instructure.com') || url.includes('canvas');
    }, "URL must be a valid Canvas instance URL (e.g., 'canvas.instructure.com' or 'your-institution.instructure.com')"),
  canvasToken: z.string().min(1, "API token is required")
});

type CanvasSetupData = z.infer<typeof canvasSetupSchema>;

export default function CanvasIntegrationPage() {
  const { toast } = useToast();

  const form = useForm<CanvasSetupData>({
    resolver: zodResolver(canvasSetupSchema),
    defaultValues: {
      canvasInstanceUrl: "",
      canvasToken: ""
    }
  });

  const canvasSetupMutation = useMutation({
    mutationFn: async (data: CanvasSetupData) => {
      // Format the Canvas URL
      let canvasUrl = data.canvasInstanceUrl;
      if (!canvasUrl.startsWith('http://') && !canvasUrl.startsWith('https://')) {
        canvasUrl = `https://${canvasUrl}`;
      }
      canvasUrl = canvasUrl.endsWith('/') ? canvasUrl.slice(0, -1) : canvasUrl;

      const res = await apiRequest("PATCH", "/api/user/canvas", {
        ...data,
        canvasInstanceUrl: canvasUrl
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update Canvas settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Canvas Integration Complete",
        description: "Your Canvas integration has been set up successfully.",
      });
      window.location.replace("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const skipCanvasMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/user/skip-canvas");
      if (!res.ok) {
        throw new Error("Failed to skip Canvas integration");
      }
    },
    onSuccess: () => {
      toast({
        title: "Canvas Integration Skipped",
        description: "You can set this up later from your dashboard settings.",
      });
      window.location.replace("/");
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

                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => canvasSetupMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="canvasInstanceUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canvas Instance URL</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="canvas.instructure.com"
                              disabled={canvasSetupMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canvasToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canvas API Token</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              placeholder="Enter your Canvas API token"
                              disabled={canvasSetupMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={canvasSetupMutation.isPending}
                    >
                      {canvasSetupMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up Canvas...
                        </>
                      ) : (
                        "Set Up Canvas Integration"
                      )}
                    </Button>
                  </form>
                </Form>
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