import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Plus, Save, X, HelpCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  groupSize: z.number().min(3, "Group size must be at least 3").max(8, "Group size cannot exceed 8"),
  courseId: z.number().optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(["skill"]),
      min: z.number(),
      max: z.number(),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

const defaultQuestions = [
  {
    id: "excel",
    text: "Excel Proficiency",
    type: "skill" as const,
    min: 0,
    max: 5,
  },
  {
    id: "speaking",
    text: "Public Speaking Comfort",
    type: "skill" as const,
    min: 0,
    max: 5,
  },
  {
    id: "writing",
    text: "Writing Ability",
    type: "skill" as const,
    min: 0,
    max: 5,
  },
  {
    id: "social",
    text: "Social Outgoingness",
    type: "skill" as const,
    min: 0,
    max: 5,
  },
  {
    id: "business",
    text: "Business Planning Experience",
    type: "skill" as const,
    min: 0,
    max: 5,
  },
];

export default function FormBuilderPage() {
  const [, setLocation] = useLocation();
  const [questions, setQuestions] = useState(defaultQuestions);
  const { toast } = useToast();

  // Get courseId and courseName from URL if available
  const params = new URLSearchParams(window.location.search);
  const courseId = parseInt(params.get("courseId") || "0");
  const courseName = params.get("courseName") || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: decodeURIComponent(courseName) || "Student Group Formation Survey",
      description: "Please rate your skills and preferences to help us form balanced teams.",
      questions: defaultQuestions,
      groupSize: 4,
      courseId: courseId || undefined,
    },
  });

  const createFormMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // First create the form
      const formRes = await apiRequest("POST", "/api/forms", values);
      const formData = await formRes.json();

      // Then create Canvas assignment if courseId exists
      if (values.courseId) {
        try {
          const assignmentRes = await apiRequest("POST", `/api/canvas/courses/${values.courseId}/assignments`, {
            formId: formData.id,
            name: values.title,
            description: values.description,
          });

          if (!assignmentRes.ok) {
            throw new Error("Failed to create Canvas assignment. The form was created and can be shared manually.");
          }
        } catch (error) {
          toast({
            title: "Note",
            description: "Form created successfully but Canvas integration failed. You can share the form link directly with students.",
          });
        }
      }

      return formData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Survey created successfully!",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
    form.setValue("questions", items);
  };

  const addCustomQuestion = () => {
    const newQuestion = {
      id: `custom-${Date.now()}`,
      text: "",
      type: "skill" as const,
      min: 0,
      max: 5,
    };
    setQuestions([...questions, newQuestion]);
    form.setValue("questions", [...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    form.setValue("questions", newQuestions);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b fixed top-0 left-0 right-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-[#C41230] cursor-pointer">
              NU Group Formation
            </h1>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8 mt-16">
        <h1 className="text-3xl font-bold mb-8">Create Group Formation Survey</h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createFormMutation.mutate(data))}
            className="space-y-8"
          >
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter instructions for students"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Explain to students how their responses will be used to create balanced groups
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="groupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Group Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={3}
                          max={8}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose the ideal size for each group. Our algorithm will distribute students evenly while optimizing skill balance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Questions
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Drag and drop questions to set their priority. Questions at the top will be given more weight in the group formation algorithm. For example, put the most important skills first to ensure groups have a good balance of those skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="questions">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {questions.map((question, index) => (
                          <Draggable
                            key={question.id}
                            draggableId={question.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg"
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab"
                                >
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <Input
                                  value={question.text}
                                  onChange={(e) => {
                                    const newQuestions = [...questions];
                                    newQuestions[index].text = e.target.value;
                                    setQuestions(newQuestions);
                                    form.setValue("questions", newQuestions);
                                  }}
                                  placeholder="Enter skill or attribute to assess"
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuestion(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomQuestion}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Question
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createFormMutation.isPending}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Create Survey
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}