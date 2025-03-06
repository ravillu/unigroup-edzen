import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(["skill"]),
      min: z.number(),
      max: z.number(),
    })
  ),
  courseId: z.number(),
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

  // Get courseId and courseName from URL
  const params = new URLSearchParams(window.location.search);
  const courseId = parseInt(params.get("courseId") || "0");
  const courseName = params.get("courseName") || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: decodeURIComponent(courseName),
      questions: defaultQuestions,
      groupSize: 4,
      courseId,
    },
  });

  const createFormMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // First create the form
      const formRes = await apiRequest("POST", "/api/forms", values);
      const formData = await formRes.json();

      // Then create Canvas assignment
      const assignmentRes = await apiRequest("POST", `/api/canvas/courses/${values.courseId}/assignments`, {
        formId: formData.id,
        name: values.title,
        description: values.description,
      });

      return formData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Form published and assignment created in Canvas",
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Group Formation Assignment</h1>

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
                      <FormLabel>Assignment Title</FormLabel>
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
                      <FormLabel>Assignment Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter instructions for students"
                          {...field}
                        />
                      </FormControl>
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
                        Choose the ideal size for each group. Students will be distributed evenly across groups.
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
                                  placeholder="Enter question text"
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
                Publish Assignment
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}