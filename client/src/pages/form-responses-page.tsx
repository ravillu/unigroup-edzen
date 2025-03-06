import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Form, Student } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

// Debugging helper
function logData(label: string, data: any) {
  console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
}

export default function FormResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const formId = id ? parseInt(id) : null;

  // Fetch form data with debugging
  const { data: form, isLoading: formLoading } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
    enabled: formId !== null,
    onSuccess: (data) => logData("Form Data", data),
    onError: (error) => console.error("Form fetch error:", error)
  });

  // Fetch students with debugging
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
    enabled: formId !== null && !!form,
    refetchInterval: 5000, // Real-time updates every 5 seconds
    onSuccess: (data) => logData("Student Responses", data),
    onError: (error) => console.error("Students fetch error:", error)
  });

  // Loading state
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

  // Form not found state
  if (!form) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Form not found. Please check the URL and try again.</p>
              <pre className="mt-4 text-left text-sm bg-muted p-4 rounded">
                Debug Info:
                formId: {formId}
                isNaN: {isNaN(formId as number)}
              </pre>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

        {/* Debug info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded">
              {JSON.stringify({ form, students }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Responses table */}
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
                    <TableHead>Major</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Skills</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.major}</TableCell>
                      <TableCell>{student.academicYear}</TableCell>
                      <TableCell>
                        <pre className="text-xs">
                          {JSON.stringify(student.skills, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No responses yet. Waiting for students to submit the form...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}