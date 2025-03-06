import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CanvasIntegrationPage() {
  const { toast } = useToast();
  
  // Fetch Canvas courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/canvas/courses"],
  });

  // Fetch students for selected course
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/canvas/courses/11526816/students"],
    enabled: true, // We know the course ID for BUSN1101-TEST
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
          {courses.map((course: any) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>
                  Total Students: {course.total_students}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Fetching Students",
                      description: `Loading students from ${course.name}...`
                    });
                  }}
                >
                  View Students
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Students Section */}
      {studentsLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Students in BUSN1101-TEST</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student: any) => (
              <Card key={student.id}>
                <CardHeader>
                  <CardTitle>{student.name}</CardTitle>
                  <CardDescription>{student.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Status: {student.enrollment_state}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
