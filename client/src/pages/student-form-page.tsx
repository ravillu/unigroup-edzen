import { useState } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form as FormType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const academicYears = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];
const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];
const nuinCampuses = [
  "Dublin, Ireland",
  "London, England",
  "Melbourne, Australia",
  "Prague, Czech Republic",
  "Rome, Italy"
];

// Updated from screenshot
const majors = [
  "MKTG - Marketing",
  "FIN - Finance",
  "Explore Business",
  "Entrepreneurship",
  "Accounting",
  "MIS - Management Information Systems",
  "Supply Chain Management",
  "Psychology",
  "MGMT - Management",
  "FINTECH - Financial Technology"
];

const ethnicities = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or More Races",
  "Prefer not to say"
];

const skillLevels = [
  { value: "0", label: "0 - No experience" },
  { value: "1", label: "1 - Basic understanding" },
  { value: "2", label: "2 - Some practical experience" },
  { value: "3", label: "3 - Competent" },
  { value: "4", label: "4 - Advanced" },
  { value: "5", label: "5 - Expert" }
];

const studentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nuid: z.string().min(1, "NUID is required"),
  gender: z.string().min(1, "Gender is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  ethnicity: z.string().min(1, "Ethnicity is required"),
  major: z.string().min(1, "Major is required"),
  isNuin: z.enum(["yes", "no"]),
  nuinCampus: z.string().optional(),
  skills: z.record(z.number().min(0).max(5)),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

type Question = {
  id: string;
  text: string;
  type: "skill";
  min: number;
  max: number;
};

export default function StudentFormPage() {
  const { id } = useParams<{ id: string }>();
  const formId = parseInt(id);
  const [submitted, setSubmitted] = useState(false);

  const { data: formData } = useQuery<FormType>({
    queryKey: [`/api/forms/${formId}`],
  });

  const questions = (formData?.questions as Question[]) || [];

  const formMethods = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      isNuin: "no",
      skills: questions.reduce(
        (acc, q) => ({ ...acc, [q.text]: 0 }),
        {} as Record<string, number>
      ),
    },
  });

  const isNuin = formMethods.watch("isNuin") === "yes";

  const submitFormMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const { isNuin, nuinCampus, ...rest } = values;
      const res = await apiRequest(
        "POST",
        `/api/forms/${formId}/students`,
        {
          ...rest,
          nunStatus: isNuin === "yes" ? nuinCampus : "N/A"
        }
      );
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (!formData) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Form not found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
              <p className="text-muted-foreground">
                Your response has been recorded.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{formData.title}</CardTitle>
            {formData.description && (
              <CardDescription>{formData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Form {...formMethods}>
              <form
                onSubmit={formMethods.handleSubmit((data) =>
                  submitFormMutation.mutate(data)
                )}
                className="space-y-6"
              >
                <FormField
                  control={formMethods.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="nuid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NUID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="ethnicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ethnicity</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ethnicity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ethnicities.map((ethnicity) => (
                            <SelectItem key={ethnicity} value={ethnicity}>
                              {ethnicity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {majors.map((major) => (
                            <SelectItem key={major} value={major}>
                              {major}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="isNuin"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Are you a NUin student?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Yes
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              No
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isNuin && (
                  <FormField
                    control={formMethods.control}
                    name="nuinCampus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NUin Campus</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select NUin campus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nuinCampuses.map((campus) => (
                              <SelectItem key={campus} value={campus}>
                                {campus}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Skills Assessment</h3>
                  {questions.map((question) => (
                    <FormField
                      key={question.id}
                      control={formMethods.control}
                      name={`skills.${question.text}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{question.text}</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Rate your skill (0-5)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {skillLevels.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitFormMutation.isPending}
                >
                  Submit Form
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}