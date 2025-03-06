import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Form, Student } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

function renderSkillLevel(level: number): string {
  const stars = "★".repeat(level);
  const emptyStars = "☆".repeat(5 - level);
  return stars + emptyStars;
}

export default function FormResponsesPage() {
  // Get the ID from the route parameters
  const { id } = useParams();
  const formId = id ? parseInt(id) : null;

  console.log('Debug - Route params:', { id, formId, isValidId: !isNaN(formId as number) }); // Debug log

  // Fetch form data with proper error handling
  const { data: form, isLoading: formLoading } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
    enabled: formId !== null && !isNaN(formId),
  });

  // Fetch students with real-time updates
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/forms/${formId}/students`],
    enabled: formId !== null && !isNaN(formId),
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Debug logs
  console.log('Debug - Form data:', form);
  console.log('Debug - Student responses:', students);

  // Invalid ID handling
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

  // Form not found
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

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