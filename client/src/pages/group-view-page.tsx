import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Student, Group } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { RefreshCw, GripVertical, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  // Calculate group statistics
  const calculateGroupStats = (groupStudents: Student[]) => {
    if (!groupStudents.length) return null;

    const stats = {
      avgSkills: {} as Record<string, number>,
      genderBalance: {} as Record<string, number>,
      ethnicityCount: {} as Record<string, number>,
    };

    // Calculate average skills
    groupStudents.forEach(student => {
      Object.entries(student.skills).forEach(([skill, value]) => {
        stats.avgSkills[skill] = (stats.avgSkills[skill] || 0) + (value as number);
      });
      stats.genderBalance[student.gender] = (stats.genderBalance[student.gender] || 0) + 1;
      stats.ethnicityCount[student.ethnicity] = (stats.ethnicityCount[student.ethnicity] || 0) + 1;
    });

    Object.keys(stats.avgSkills).forEach(skill => {
      stats.avgSkills[skill] = +(stats.avgSkills[skill] / groupStudents.length).toFixed(1);
    });

    return stats;
  };

  // Show loading state while initial data is being fetched
  if (formLoading || studentsLoading || groupsLoading) {
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

        {/* Group Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Group Configuration</CardTitle>
            <CardDescription className="space-y-2">
              <p>Advanced AI-driven group formation algorithm that:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Prioritizes students with key skills (rated 4-5)</li>
                <li>Ensures balanced distribution across groups:
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                    <li>Gender balance</li>
                    <li>Ethnic diversity</li>
                    <li>Academic year mix</li>
                    <li>NUin status distribution</li>
                  </ul>
                </li>
                <li>Optimizes skill complementarity within groups</li>
                <li>Uses intelligent constraint satisfaction</li>
              </ol>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>Group Size</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input 
                    type="number" 
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value))}
                    min={3}
                    max={8}
                    className="max-w-[100px]"
                  />
                  <span className="text-sm text-muted-foreground">students per group</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg">Skill Priorities</Label>
                <p className="text-sm text-muted-foreground -mt-2">
                  Set the importance of each skill (1 = least important, 5 = most important)
                </p>
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
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${generateGroupsMutation.isPending ? 'animate-spin' : ''}`} />
                {generateGroupsMutation.isPending ? 'Generating Groups...' : 'Generate Groups'}
              </Button>

              {groups.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  <UserCog className="inline-block mr-2 h-4 w-4" />
                  Tip: Drag and drop students between groups to make manual adjustments
                </p>
              )}
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
                const stats = calculateGroupStats(groupStudents);

                return (
                  <Card key={group.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{group.name}</span>
                        <Badge variant="outline">
                          {groupStudents.length} members
                        </Badge>
                      </CardTitle>
                      {stats && (
                        <CardDescription className="mt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="font-medium mb-1">Average Skills</p>
                              {Object.entries(stats.avgSkills).map(([skill, avg]) => (
                                <div key={skill} className="flex justify-between text-sm">
                                  <span>{skill}:</span>
                                  <span className="font-mono">{avg}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="font-medium mb-1">Demographics</p>
                              {Object.entries(stats.genderBalance).map(([gender, count]) => (
                                <div key={gender} className="text-sm">
                                  {gender}: {count}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Droppable droppableId={String(group.id)}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "rounded-md",
                              snapshot.isDraggingOver && "bg-muted/50"
                            )}
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-4"></TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Demographics</TableHead>
                                  {form?.questions.map((q: any) => (
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
                                    {(provided, snapshot) => (
                                      <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                          snapshot.isDragging && "bg-muted border-2 border-primary"
                                        )}
                                      >
                                        <TableCell>
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-move hover:text-primary"
                                          >
                                            <GripVertical className="h-4 w-4" />
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {student.name}
                                          <div className="text-sm text-muted-foreground">
                                            {student.major} • {student.academicYear}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {student.gender} • {student.ethnicity}
                                          <div className="text-sm text-muted-foreground">
                                            {student.nunStatus}
                                          </div>
                                        </TableCell>
                                        {form?.questions.map((q: any) => (
                                          <TableCell key={q.id} className="font-mono">
                                            <Badge 
                                              variant={(student.skills as any)[q.text] >= 4 ? "default" : "secondary"}
                                              className="w-8 h-8 rounded-full"
                                            >
                                              {(student.skills as any)[q.text]}
                                            </Badge>
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