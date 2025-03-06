import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ClipboardCopy, FileText, Trash2, Database, BookOpen, Users, Settings } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  total_students: number;
}

export default function DashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only fetch courses if Canvas is integrated
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<CanvasCourse[]>({
    queryKey: ["/api/canvas/courses"],
    enabled: !!user?.canvasToken,
  });

  const { data: forms = [], isLoading: isLoadingForms } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (formId: number) => {
      const res = await apiRequest("DELETE", `/api/forms/${formId}`);
      if (!res.ok) throw new Error('Failed to delete form');
      return formId;
    },
    onSuccess: (formId) => {
      queryClient.setQueryData<Form[]>(["/api/forms"], (oldData) =>
        oldData?.filter(form => form.id !== formId) || []
      );
      toast({
        title: "Success",
        description: "Survey has been deleted",
      });
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
              NU Group Formation
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            {!user?.canvasToken && (
              <Link href="/canvas">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Set Up Canvas
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="space-y-8">
          {/* Manual Form Creation or Canvas Courses Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create New Survey</h2>
            </div>

            {!user?.canvasToken ? (
              // Show manual form creation when Canvas is not integrated
              <Card>
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Create a New Survey</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Create a group formation survey and share the link with your students.
                      You can manage responses and create groups manually.
                    </p>
                    <Link href="/forms/new">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Survey
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Show Canvas courses when integrated
              isLoadingCourses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No courses found. Make sure you have active courses in Canvas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>{course.course_code}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {course.total_students} students enrolled
                        </p>
                        <Link href={`/forms/new?courseId=${course.id}&courseName=${encodeURIComponent(course.name)}`}>
                          <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Publish Survey
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
          </section>

          {/* Responses Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">View Responses</h2>
            </div>

            {isLoadingForms ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : forms.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No surveys published yet. Create your first survey to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                  <Card key={form.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{form.title}</CardTitle>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this survey? This will permanently remove all responses and groups associated with it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteFormMutation.mutate(form.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {form.description || "No description"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/forms/${form.id}/submit`;
                            navigator.clipboard.writeText(url);
                            toast({
                              title: "URL Copied",
                              description: "Form URL has been copied to clipboard",
                            });
                          }}
                          className="w-full sm:w-auto"
                        >
                          <ClipboardCopy className="mr-2 h-4 w-4" />
                          Copy Form URL
                        </Button>
                        <Link href={`/forms/${form.id}/responses`} className="w-full sm:w-auto">
                          <Button size="sm" className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            View Responses
                          </Button>
                        </Link>
                        <Link href={`/forms/${form.id}/groups`} className="w-full sm:w-auto">
                          <Button size="sm" className="w-full">
                            <Users className="mr-2 h-4 w-4" />
                            View Groups
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}