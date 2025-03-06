import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Student, Group } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Skill level rendering helper
function renderSkillLevel(level: number): string {
  const stars = "★".repeat(level);
  const emptyStars = "☆".repeat(5 - level);
  return stars + emptyStars;
}

export default function GroupViewPage() {
  const { id } = useParams<{ id: string }>();
  const formId = parseInt(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Data fetching with proper error handling
  const { data: form, isLoading: formLoading, error: formError } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
    enabled: !isNaN(formId),
    onError: () => {
      console.error('Failed to fetch form data:', formError);
      toast({
        title: "Error",
        description: "Failed to load form data. Please try again.",
        variant: "destructive",
      });
    }
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
    enabled: !isNaN(formId),
    onSuccess: (data) => {
      console.log(`Loaded ${data.length} student responses`);
    }
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: [`/api/forms/${formId}/groups`],
    enabled: !isNaN(formId)
  });

  const generateGroupsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/forms/${formId}/groups/generate`,
        { formId }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/groups`] });
      toast({
        title: "Success",
        description: "Groups have been generated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to generate groups:', error);
      toast({
        title: "Error",
        description: "Failed to generate groups. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Error state for invalid form ID
  if (isNaN(formId)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Invalid form ID. Please check the URL and try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (formLoading || studentsLoading || groupsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Form not found state
  if (!form) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Form not found. Please check the URL and try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => generateGroupsMutation.mutate()}
            disabled={generateGroupsMutation.isPending || students.length === 0}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generateGroupsMutation.isPending ? 'animate-spin' : ''}`} />
            {generateGroupsMutation.isPending ? 'Generating...' : 'Generate Groups'}
          </Button>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <UserPlus2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No students have submitted responses yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Responses</CardTitle>
                <CardDescription>
                  {students.length} students have submitted their responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="p-4 border rounded-lg">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.major} • {student.academicYear}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {Object.entries(student.skills as Record<string, number>).map(
                          ([skill, level]) => (
                            <div key={skill} className="text-sm">
                              {skill}: {renderSkillLevel(level)}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {groups.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Generated Groups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => {
                    const groupStudents = students.filter(student =>
                      group.studentIds.includes(student.id)
                    );

                    return (
                      <Card key={group.id}>
                        <CardHeader>
                          <CardTitle>{group.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {groupStudents.map(student => (
                              <div key={student.id} className="p-2 rounded-md bg-muted/50">
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {student.major} • {student.academicYear}
                                </div>
                                <div className="mt-1 text-sm">
                                  {Object.entries(student.skills as Record<string, number>).map(
                                    ([skill, level]) => (
                                      <div key={skill}>
                                        {skill}: {renderSkillLevel(level)}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}