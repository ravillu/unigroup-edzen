import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Student } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function renderSkillLevel(level: number): string {
  const stars = "★".repeat(level);
  const emptyStars = "☆".repeat(5 - level);
  return stars + emptyStars;
}

export default function FormResponsesPage() {
  const { id } = useParams();
  const formId = id ? parseInt(id) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showGroupConfig, setShowGroupConfig] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [skillPriorities, setSkillPriorities] = useState<Record<string, number>>({});

  console.log('Debug - Route params:', { id, formId, isValidId: !isNaN(formId as number) });

  const { data: form, isLoading: formLoading } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
    enabled: formId !== null && !isNaN(formId),
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
    enabled: formId !== null && !isNaN(formId),
    refetchInterval: 5000,
  });

  // Group generation mutation
  const generateGroupsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/forms/${formId}/groups/generate`,
        {
          groupSize,
          skillPriorities
        }
      );
      if (!response.ok) {
        throw new Error('Failed to generate groups');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/groups`] });
      toast({
        title: "Success",
        description: "Groups have been generated successfully.",
      });
      setShowGroupConfig(false);
    },
    onError: (error) => {
      console.error('Failed to generate groups:', error);
      toast({
        title: "Error",
        description: "Failed to generate groups. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!id || !formId || isNaN(formId)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Invalid form URL. Please check the link and try again.</p>
              <pre className="mt-4 text-xs bg-muted p-4 rounded">
                Debug Info:
                Route ID param: {id}
                Parsed form ID: {formId}
                Valid number: {!isNaN(formId as number)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          {students.length > 0 && !showGroupConfig && (
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
        <Card>
          <CardHeader>
            <CardTitle>Student Responses</CardTitle>
            <p className="text-sm text-muted-foreground">
              {students.length} responses received
              {studentsLoading && " (Refreshing...)"}
            </p>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NUID</TableHead>
                    <TableHead>Major</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>NUin Status</TableHead>
                    {(form.questions || []).map((question: any) => (
                      <TableHead key={question.id}>{question.text}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.nuid}</TableCell>
                      <TableCell>{student.major}</TableCell>
                      <TableCell>{student.academicYear}</TableCell>
                      <TableCell>{student.nunStatus}</TableCell>
                      {(form.questions || []).map((question: any) => (
                        <TableCell key={question.id}>
                          {renderSkillLevel((student.skills as any)[question.text])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No responses yet. Waiting for students to submit the form...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}