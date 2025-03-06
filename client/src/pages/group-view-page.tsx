import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Student, Group } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function GroupViewPage() {
  const { id } = useParams<{ id: string }>();
  const formId = id ? parseInt(id) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [groupSize, setGroupSize] = useState(4);
  const [skillPriorities, setSkillPriorities] = useState<Record<string, number>>({});

  // Fetch form data
  const { data: form, isLoading: formLoading } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
    enabled: formId !== null,
    retry: 3,
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch students with proper error handling
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
    enabled: formId !== null && !!form,
    retry: 3,
    staleTime: 0,
  });

  // Fetch groups with proper error handling
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: [`/api/forms/${formId}/groups`],
    enabled: formId !== null && !!form,
    retry: 3,
    staleTime: 0,
  });

  const generateGroupsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        groupSize,
        skillPriorities: Object.fromEntries(
          form?.questions.map((q: any) => [q.text, skillPriorities[q.text] || 1]) || []
        )
      };
      console.log('Generating groups with payload:', payload);

      const res = await apiRequest(
        "POST",
        `/api/forms/${formId}/groups/generate`,
        payload
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Group generation failed:', errorText);
        throw new Error('Failed to generate groups');
      }

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

  // Show loading state while initial data is being fetched
  if (formLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading form data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle missing or invalid form
  if (!formId || !form) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Form not found. Please check the URL and try again.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Form header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{form?.title}</h1>
            {form?.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </div>
        </div>

        {/* Group Configuration Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Group Configuration</CardTitle>
            <CardDescription>
              Advanced AI-driven group formation algorithm that:
              1. Prioritizes students with key skills (rated 4-5)
              2. Ensures balanced distribution across groups:
                 • Gender balance
                 • Ethnic diversity
                 • Academic year mix
                 • NUin status distribution
              3. Optimizes skill complementarity within groups
              4. Uses backtracking for constraint satisfaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>Group Size</Label>
                <Input 
                  type="number" 
                  value={groupSize}
                  onChange={(e) => setGroupSize(parseInt(e.target.value))}
                  min={3}
                  max={8}
                  className="max-w-xs"
                />
              </div>

              <div className="space-y-4">
                <Label>Skill Priorities (Higher value = more important)</Label>
                {form?.questions.map((question: any) => (
                  <div key={question.id} className="grid gap-2">
                    <Label>{question.text}</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        defaultValue={[skillPriorities[question.text] || 1]}
                        max={5}
                        min={1}
                        step={1}
                        onValueChange={([value]) => 
                          setSkillPriorities(prev => ({
                            ...prev,
                            [question.text]: value
                          }))
                        }
                        className="flex-1"
                      />
                      <span className="w-8 text-center">
                        {skillPriorities[question.text] || 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => generateGroupsMutation.mutate()}
                disabled={generateGroupsMutation.isPending}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${generateGroupsMutation.isPending ? 'animate-spin' : ''}`} />
                {generateGroupsMutation.isPending ? 'Generating...' : 'Generate Groups'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Groups */}
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
                      <CardDescription>
                        {groupStudents.length} members
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {groupStudents.map(student => (
                          <div key={student.id} className="p-2 rounded-md bg-muted/50">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                {student.major} • {student.academicYear} • {student.nunStatus === 'Yes' ? 'NUin' : 'Non-NUin'}
                              </div>
                              <div>
                                {student.gender} • {student.ethnicity}
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              {Object.entries(student.skills as Record<string, number>).map(
                                ([skill, level]) => (
                                  <div key={skill} className="flex justify-between">
                                    <span>{skill}:</span>
                                    <span className="font-mono">{level}</span>
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
    </div>
  );
}