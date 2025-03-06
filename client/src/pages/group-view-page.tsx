import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Student, Group } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    staleTime: 0,
  });

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
    enabled: formId !== null && !!form,
    retry: 3,
    staleTime: 0,
  });

  // Fetch groups
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

  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, studentIds }: { groupId: number; studentIds: number[] }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/groups/${groupId}`,
        { studentIds }
      );
      if (!res.ok) throw new Error('Failed to update group');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/groups`] });
    }
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceGroupId = parseInt(result.source.droppableId);
    const destGroupId = parseInt(result.destination.droppableId);
    const studentId = parseInt(result.draggableId);

    const sourceGroup = groups.find(g => g.id === sourceGroupId);
    const destGroup = groups.find(g => g.id === destGroupId);

    if (!sourceGroup || !destGroup) return;

    const newSourceStudentIds = sourceGroup.studentIds.filter(id => id !== studentId);
    const newDestStudentIds = [...destGroup.studentIds, studentId];

    updateGroupMutation.mutateAsync({ groupId: sourceGroup.id, studentIds: newSourceStudentIds });
    updateGroupMutation.mutateAsync({ groupId: destGroup.id, studentIds: newDestStudentIds });
  };

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
                <Label>Skill Priorities</Label>
                {form?.questions.map((question: any) => (
                  <div key={question.id} className="grid gap-2">
                    <Label>{question.text}</Label>
                    <RadioGroup
                      defaultValue={String(skillPriorities[question.text] || 1)}
                      onValueChange={(value) =>
                        setSkillPriorities(prev => ({
                          ...prev,
                          [question.text]: parseInt(value)
                        }))
                      }
                      className="flex items-center gap-4"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div key={value} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(value)} id={`${question.id}-${value}`} />
                          <Label htmlFor={`${question.id}-${value}`}>{value}</Label>
                        </div>
                      ))}
                    </RadioGroup>
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
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="mt-8 space-y-8">
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
                      <Droppable droppableId={String(group.id)}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Demographics</TableHead>
                                  {form.questions.map((q: any) => (
                                    <TableHead key={q.id}>{q.text}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {groupStudents.map((student, index) => (
                                  <Draggable
                                    key={student.id}
                                    draggableId={String(student.id)}
                                    index={index}
                                  >
                                    {(provided) => (
                                      <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <TableCell className="font-medium">
                                          {student.name}
                                          <div className="text-sm text-muted-foreground">
                                            {student.major} • {student.academicYear}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {student.gender} • {student.ethnicity}
                                          <div className="text-sm text-muted-foreground">
                                            {student.nunStatus === 'Yes' ? 'NUin' : 'Non-NUin'}
                                          </div>
                                        </TableCell>
                                        {form.questions.map((q: any) => (
                                          <TableCell key={q.id} className="font-mono">
                                            {(student.skills as any)[q.text]}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}