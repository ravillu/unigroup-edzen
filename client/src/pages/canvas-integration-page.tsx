import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import { useState } from "react";

interface CanvasCourse {
  id: number;
  name: string;
  total_students: number;
}

interface CanvasStudent {
  id: number;
  name: string;
  email: string;
  sortable_name: string;
  short_name: string;
  enrollment_state: string;
}

export default function CanvasIntegrationPage() {
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Fetch Canvas courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery<CanvasCourse[]>({
    queryKey: ["/api/canvas/courses"],
  });

  // Fetch students for selected course
  const { data: students = [], isLoading: studentsLoading } = useQuery<CanvasStudent[]>({
    queryKey: [`/api/canvas/courses/${selectedCourseId}/students`],
    enabled: selectedCourseId !== null,
  });

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Canvas Integration</h1>

      {/* Courses Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Canvas Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className={selectedCourseId === course.id ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>
                  Total Students: {course.total_students}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    toast({
                      title: "Loading Students",
                      description: `Fetching students from ${course.name}...`
                    });
                  }}
                  variant={selectedCourseId === course.id ? "secondary" : "default"}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {selectedCourseId === course.id ? 'Viewing Students' : 'View Students'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Students Section */}
      {selectedCourseId && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Students in {courses.find(c => c.id === selectedCourseId)?.name}
          </h2>
          {studentsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <Card key={student.id}>
                  <CardHeader>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>{student.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Status: {student.enrollment_state}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {students.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  No active students found in this course.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}