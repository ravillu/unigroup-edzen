import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ClipboardCopy, FileText, Trash2, Database, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<CanvasCourse[]>({
    queryKey: ["/api/canvas/courses"],
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
        description: "Form has been deleted",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#C41230]">
            NU Group Formation
          </h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Courses Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Canvas Courses</h2>
            </div>

            {isLoadingCourses ? (
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
                      <Link href={`/forms/new?courseId=${course.id}`}>
                        <Button className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Group Formation
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Active Forms Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Active Group Formations</h2>
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
                    You haven't created any group formations yet. Select a course above to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                  <Card key={form.id}>
                    <CardHeader>
                      <CardTitle>{form.title}</CardTitle>
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
                              description: "Student submission form URL has been copied to clipboard",
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