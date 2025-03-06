import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form, Student, Group } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function GroupViewPage() {
  const { id } = useParams<{ id: string }>();
  const formId = parseInt(id);

  const { data: form } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: [`/api/forms/${formId}/groups`],
  });

  const generateGroupsMutation = useMutation({
    mutationFn: async () => {
      // Simple group generation algorithm that tries to balance skills
      const studentsPerGroup = Math.ceil(students.length / 4); // Aim for 4 groups
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      
      const newGroups = [];
      for (let i = 0; i < shuffled.length; i += studentsPerGroup) {
        const groupStudents = shuffled.slice(i, i + studentsPerGroup);
        const group = {
          formId,
          name: `Group ${newGroups.length + 1}`,
          studentIds: groupStudents.map(s => s.id)
        };
        const res = await apiRequest("POST", `/api/forms/${formId}/groups`, group);
        newGroups.push(await res.json());
      }
      return newGroups;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/groups`] });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({
      groupId,
      studentId,
      targetGroupId,
    }: {
      groupId: number;
      studentId: number;
      targetGroupId: number;
    }) => {
      const sourceGroup = groups.find((g) => g.id === groupId);
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      if (!sourceGroup || !targetGroup) return;

      const newSourceStudentIds = sourceGroup.studentIds.filter(
        (id) => id !== studentId
      );
      const newTargetStudentIds = [...targetGroup.studentIds, studentId];

      await Promise.all([
        apiRequest("PATCH", `/api/groups/${groupId}`, {
          studentIds: newSourceStudentIds,
        }),
        apiRequest("PATCH", `/api/groups/${targetGroupId}`, {
          studentIds: newTargetStudentIds,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/groups`] });
    },
  });

  const getStudentById = (id: number) => students.find((s) => s.id === id);

  const renderSkillLevel = (level: number) => {
    return "★".repeat(level) + "☆".repeat(5 - level);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{form?.title}</h1>
            {form?.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => generateGroupsMutation.mutate()}
              disabled={generateGroupsMutation.isPending || students.length === 0}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Groups
            </Button>
          </div>
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
        ) : groups.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NUID</TableHead>
                    <TableHead>Major</TableHead>
                    <TableHead>Skills</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.nuid}</TableCell>
                      <TableCell>{student.major}</TableCell>
                      <TableCell>
                        {Object.entries(student.skills as Record<string, number>).map(
                          ([skill, level]) => (
                            <div key={skill} className="text-sm">
                              {skill}: {renderSkillLevel(level)}
                            </div>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {group.studentIds.map((studentId) => {
                        const student = getStudentById(studentId);
                        if (!student) return null;
                        return (
                          <TableRow key={studentId}>
                            <TableCell>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.major}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {Object.entries(
                                  student.skills as Record<string, number>
                                ).map(([skill, level]) => (
                                  <div key={skill}>
                                    {skill}: {renderSkillLevel(level)}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <select
                                className="w-full text-sm p-2 border rounded"
                                onChange={(e) => {
                                  updateGroupMutation.mutate({
                                    groupId: group.id,
                                    studentId: student.id,
                                    targetGroupId: parseInt(e.target.value),
                                  });
                                }}
                              >
                                <option value={group.id}>Move to...</option>
                                {groups
                                  .filter((g) => g.id !== group.id)
                                  .map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                              </select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
