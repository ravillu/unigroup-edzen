import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form, Student, Group } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

function renderSkillLevel(level: number): string {
  const stars = "★".repeat(level);
  const emptyStars = "☆".repeat(5 - level);
  return stars + emptyStars;
}

function calculateGroupFitness(group: Student[], newStudent: Student): number {
  let fitness = 0;

  // Gender balance
  const genderCounts = group.reduce((acc: Record<string, number>, student) => {
    acc[student.gender] = (acc[student.gender] || 0) + 1;
    return acc;
  }, {});
  if (genderCounts[newStudent.gender] >= Math.ceil(group.length / 2)) {
    fitness -= 2;
  }

  // Ethnic diversity
  const ethnicityCounts = group.reduce((acc: Record<string, number>, student) => {
    acc[student.ethnicity] = (acc[student.ethnicity] || 0) + 1;
    return acc;
  }, {});
  if (ethnicityCounts[newStudent.ethnicity] >= Math.ceil(group.length / 3)) {
    fitness -= 2;
  }

  // NUin uniqueness
  if (group.some(student => student.nunStatus === newStudent.nunStatus && newStudent.nunStatus !== "N/A")) {
    fitness -= 3;
  }

  // Skill complementarity
  const existingSkills = group.reduce((acc: Record<string, number[]>, student) => {
    Object.entries(student.skills as Record<string, number>).forEach(([skill, level]) => {
      if (!acc[skill]) acc[skill] = [];
      acc[skill].push(level);
    });
    return acc;
  }, {});

  Object.entries(newStudent.skills as Record<string, number>).forEach(([skill, level]) => {
    const avgSkill = existingSkills[skill] 
      ? existingSkills[skill].reduce((a, b) => a + b, 0) / existingSkills[skill].length 
      : 0;
    if (Math.abs(avgSkill - level) >= 2) {
      fitness += 1; // Reward skill diversity
    }
  });

  return fitness;
}

function findBestGroup(student: Student, groups: Student[][]): number {
  let bestGroupIndex = 0;
  let bestFitness = -Infinity;

  groups.forEach((group, index) => {
    const fitness = calculateGroupFitness(group, student);
    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestGroupIndex = index;
    }
  });

  return bestGroupIndex;
}

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
      // Advanced group generation algorithm
      const numGroups = Math.ceil(students.length / 4); // Aim for 4-5 students per group
      const newGroups: Student[][] = Array.from({ length: numGroups }, () => []);

      // Sort students by skill level (prioritize high skills)
      const sortedStudents = [...students].sort((a, b) => {
        const aSkills = Object.values(a.skills as Record<string, number>);
        const bSkills = Object.values(b.skills as Record<string, number>);
        const aHighSkills = aSkills.filter(skill => skill >= 4).length;
        const bHighSkills = bSkills.filter(skill => skill >= 4).length;
        return bHighSkills - aHighSkills;
      });

      // First pass: distribute students with high skills
      const highSkilledStudents = sortedStudents.filter(student => 
        Object.values(student.skills as Record<string, number>).some(skill => skill >= 4)
      );

      highSkilledStudents.forEach((student, index) => {
        newGroups[index % numGroups].push(student);
      });

      // Second pass: distribute remaining students
      const remainingStudents = sortedStudents.filter(student => 
        !Object.values(student.skills as Record<string, number>).some(skill => skill >= 4)
      );

      remainingStudents.forEach(student => {
        const bestGroupIndex = findBestGroup(student, newGroups);
        newGroups[bestGroupIndex].push(student);
      });

      // Create groups in database
      const createdGroups = [];
      for (let i = 0; i < newGroups.length; i++) {
        const group = {
          formId,
          name: `Group ${i + 1}`,
          studentIds: newGroups[i].map(s => s.id),
        };
        const res = await apiRequest("POST", `/api/forms/${formId}/groups`, group);
        createdGroups.push(await res.json());
      }

      return createdGroups;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/groups`] });
    },
  });

  const getStudentById = (id: number) => students.find((s) => s.id === id);

  if (!form) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Form not found.</p>
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
          <div className="space-y-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Generate Groups</CardTitle>
                <CardDescription>
                  Click the button below to automatically generate balanced student groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => generateGroupsMutation.mutate()} 
                  disabled={generateGroupsMutation.isPending}
                >
                  {generateGroupsMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Groups
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Generated Groups</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateGroupsMutation.mutate()}
                disabled={generateGroupsMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>

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
                          <div key={student.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.major}</div>
                              <div className="text-sm">
                                {Object.entries(student.skills as Record<string, number>).map(
                                  ([skill, level]) => (
                                    <div key={skill}>
                                      {skill}: {renderSkillLevel(level)}
                                    </div>
                                  )
                                )}
                              </div>
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