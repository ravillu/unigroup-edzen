import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertInstitutionSchema, type InsertInstitution } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InstitutionOnboardingPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<InsertInstitution>({
    resolver: zodResolver(insertInstitutionSchema),
  });

  const createInstitutionMutation = useMutation({
    mutationFn: async (values: InsertInstitution) => {
      const res = await apiRequest("POST", "/api/institutions", values);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Institution registered successfully",
        description: "Your institution has been registered with the platform.",
      });
      setStep(2);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Institution Registration</h1>
          <p className="text-muted-foreground">
            Register your university to start using our group formation tool
          </p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Institution Details</CardTitle>
              <CardDescription>
                Enter your institution's information to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    createInstitutionMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Northeastern University" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canvasInstanceUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canvas Instance URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. https://northeastern.instructure.com" />
                        </FormControl>
                        <FormDescription>
                          The base URL of your Canvas instance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canvasClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canvas Client ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Canvas Developer Key ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canvasClientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canvas Client Secret</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Canvas Developer Key Secret
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createInstitutionMutation.isPending}
                  >
                    Register Institution
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Registration Complete!</CardTitle>
              <CardDescription>
                Your institution has been successfully registered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Here's what to do next:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Configure the LTI integration in your Canvas instance</li>
                <li>Share the login link with your professors</li>
                <li>They can now use Canvas SSO to access the platform</li>
              </ol>
              <Button
                className="w-full"
                onClick={() => window.location.href = "/"}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
