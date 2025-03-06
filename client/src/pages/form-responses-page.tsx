import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Student, Group } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Skill level rendering helper
function renderSkillLevel(level: number): string {
  const stars = "★".repeat(level);
  const emptyStars = "☆".repeat(5 - level);
  return stars + emptyStars;
}

export default function FormResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const formId = id ? parseInt(id) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showGroupConfig, setShowGroupConfig] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [skillPriorities, setSkillPriorities] = useState<Record<string, number>>({});
  const [groupsGenerated, setGroupsGenerated] = useState(false); // Track if groups are generated

  // Fetch form data
  const { data: form, isLoading: formLoading } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
    enabled: formId !== null,
    retry: 3,
    staleTime: 0,
  });

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
    enabled: formId !== null && !!form,
    retry: 3,
    staleTime: 0,
  });

  // Fetch existing groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: [`/api/forms/${formId}/groups`],
    enabled: formId !== null && !!form && groupsGenerated, //Only fetch if groups are generated
    retry: 3,
    staleTime: 0,
  });

  const generateGroupsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/forms/${formId}/groups/generate`,
        { 
          formId,
          groupSize,
          skillPriorities 
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/groups`] });
      toast({
        title: "Success",
        description: "Groups have been generated successfully.",
      });
      setShowGroupConfig(false);
      setGroupsGenerated(true); //Update state after successful generation
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
            <h1 className="text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </div>
          {students.length > 0 && ( //Always show button
            <Button
              onClick={() => setShowGroupConfig(true)}
              className="flex items-center"
            >
              <Users className="mr-2 h-4 w-4" />
              Configure Groups
            </Button>
          )}
        </div>

        {/* Group Configuration Section */}
        {showGroupConfig && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Group Configuration</CardTitle>
              <CardDescription>
                Configure group size and skill priorities before generating groups
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
                    min={2}
                    max={6}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Skill Priorities</Label>
                  {form.questions.map((question: any) => (
                    <div key={question.id} className="grid gap-2">
                      <Label>{question.text}</Label>
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
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => generateGroupsMutation.mutate()}
                    disabled={generateGroupsMutation.isPending}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${generateGroupsMutation.isPending ? 'animate-spin' : ''}`} />
                    {generateGroupsMutation.isPending ? 'Generating...' : 'Generate Groups'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowGroupConfig(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Responses Table */}
        {studentsLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading responses...</p>
            </CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <UserPlus2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No students have submitted responses yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Student Responses</CardTitle>
              <CardDescription>
                {students.length} students have submitted their responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Major</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>NUin Status</TableHead>
                      {form.questions.map((question: any) => (
                        <TableHead key={question.id}>{question.text}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.major}</TableCell>
                        <TableCell>{student.academicYear}</TableCell>
                        <TableCell>{student.nunStatus}</TableCell>
                        {form.questions.map((question: any) => (
                          <TableCell key={question.id}>
                            {renderSkillLevel((student.skills as any)[question.text])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Groups Section */}
        {groupsGenerated && !groupsLoading && groups.length > 0 && ( // Show only after generation
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Generated Groups</CardTitle>
                <CardDescription>
                  {groups.length} groups have been created
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => {
                    const groupStudents = students.filter(student =>
                      group.studentIds.includes(student.id)
                    );

                    return (
                      <div key={group.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">{group.name}</h3>
                        <div className="space-y-3">
                          {groupStudents.map(student => (
                            <div key={student.id} className="p-2 bg-muted rounded">
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.major} • {student.academicYear}
                              </div>
                              <div className="mt-1 grid grid-cols-2 gap-x-2 text-sm">
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
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}