import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, ChevronRight, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

interface CanvasCourse {
  id: number;
  name: string;
  total_students: number;
}

interface CanvasStudent {
  id: number;
  name: string;
  email: string;
  sortable_name: string;
  short_name: string;
}

const canvasConfigSchema = z.object({
  canvasInstanceUrl: z.string().url("Please enter a valid Canvas URL"),
  canvasToken: z.string().min(1, "API token is required"),
});

type CanvasConfigForm = z.infer<typeof canvasConfigSchema>;

export default function CanvasIntegrationPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  const form = useForm<CanvasConfigForm>({
    resolver: zodResolver(canvasConfigSchema),
  });

  // Fetch Canvas courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery<CanvasCourse[]>({
    queryKey: ["/api/canvas/courses"],
  });

  // Fetch students for selected course
  const { data: students = [], isLoading: studentsLoading } = useQuery<CanvasStudent[]>({
    queryKey: [`/api/canvas/courses/${selectedCourseId}/students`],
    enabled: selectedCourseId !== null,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b fixed top-0 left-0 right-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-[#C41230] cursor-pointer">
              NU Group Formation
            </h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Canvas Integration Setup</h1>

          {step === 1 && (
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
                  <Button onClick={() => setStep(2)} className="w-full">
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
                    onClick={() => {
                      toast({
                        title: "Canvas Integration Skipped",
                        description: "You can set this up later from your dashboard settings.",
                      });
                      setLocation("/");
                    }} 
                    className="w-full"
                  >
                    Skip for Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Get Your Canvas API Token</CardTitle>
                <CardDescription>
                  Follow these steps to get your Canvas API token:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-4">
                  <li>Log in to your Canvas account</li>
                  <li>Click on Account in the global navigation menu</li>
                  <li>Click on Settings</li>
                  <li>Scroll down to Approved Integrations section</li>
                  <li>Click on "+ New Access Token"</li>
                  <li>Give your token a purpose (e.g., "Group Formation Tool")</li>
                  <li>Copy your token (you won't be able to see it again)</li>
                </ol>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    I Have My Token
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Configure Canvas Integration</CardTitle>
                <CardDescription>
                  Enter your Canvas instance URL and API token to connect your courses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="canvasInstanceUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canvas Instance URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. https://northeastern.instructure.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The base URL of your institution's Canvas instance
                          </FormDescription>
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
                              type="password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The API token you generated in Step 1
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button onClick={() => setStep(4)} type="submit">
                        Connect to Canvas
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Verify Connection</CardTitle>
                <CardDescription>
                  Let's verify your Canvas connection by checking your courses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <p>Successfully connected to Canvas!</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map((course) => (
                        <Card key={course.id}>
                          <CardHeader>
                            <CardTitle>{course.name}</CardTitle>
                            <CardDescription>
                              {course.total_students} students enrolled
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                    <Link href="/">
                      <Button className="w-full mt-4">
                        Go to Dashboard
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                    <h3 className="text-lg font-semibold">No Courses Found</h3>
                    <p className="text-muted-foreground">
                      We couldn't find any courses. This might be because:
                    </p>
                    <ul className="text-left list-disc list-inside">
                      <li>You don't have any active courses</li>
                      <li>Your Canvas API token doesn't have sufficient permissions</li>
                      <li>The Canvas instance URL is incorrect</li>
                    </ul>
                    <div className="flex gap-4 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(3)}
                        className="flex-1"
                      >
                        Try Again
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Canvas Integration Skipped",
                            description: "You can set this up later from your dashboard settings.",
                          });
                          setLocation("/");
                        }}
                        className="flex-1"
                      >
                        Skip for Now
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}