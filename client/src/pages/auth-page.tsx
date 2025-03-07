import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as framerMotion from "framer-motion";
import { 
  AtSign, 
  Lock, 
  User, 
  EyeOff, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  Github,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { cn } from "@/lib/utils";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

const registerSchema = insertUserSchema.extend({
  email: z.string().email("Please enter a valid email address"),
  confirmPassword: z.string(),
}).pick({
  username: true,
  password: true,
  confirmPassword: true,
  email: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

function PasswordStrengthMeter({ password }: { password: string }) {
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;

    // Length
    if (pass.length > 8) score += 25;
    // Contains number
    if (/\d/.test(pass)) score += 25;
    // Contains uppercase and lowercase
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 25;
    // Contains special char
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 25;

    return score;
  };

  const strength = getStrength(password);
  const getColor = () => {
    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-orange-500";
    if (strength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="w-full space-y-2">
      <Progress value={strength} className={cn("h-2 transition-all", getColor())} />
      <p className="text-sm text-muted-foreground">
        {strength <= 25 && "Weak password"}
        {strength > 25 && strength <= 50 && "Fair password"}
        {strength > 50 && strength <= 75 && "Good password"}
        {strength > 75 && "Strong password"}
      </p>
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleForgotPassword = async (data: ForgotPasswordData) => {
    // TODO: Implement forgot password functionality
    console.log("Reset password for:", data.email);
  };

  useEffect(() => {
    if (user) {
      console.log("Auth state:", { user, hasCanvasToken: user.canvasToken });
      if (user.canvasToken) {
        setLocation("/");
      } else {
        setLocation("/canvas");
      }
    } else {
      console.log("No authenticated user");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-muted/50 flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <framerMotion.motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">UniGroup by EdZen AI</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <framerMotion.AnimatePresence mode="wait">
                {mode === "login" && (
                  <framerMotion.motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit((data) =>
                          loginMutation.mutate(data)
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input {...field} className="pl-10" />
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    {...field}
                                    className="pl-10 pr-10"
                                  />
                                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode("forgot")}
                          >
                            Forgot password?
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode("register")}
                          >
                            Create account
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? "Signing in..." : "Sign in"}
                          </Button>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="w-full">
                              <Github className="mr-2 h-4 w-4" />
                              Github
                            </Button>
                            <Button variant="outline" className="w-full">
                              <SiGoogle className="mr-2 h-4 w-4" />
                              Google
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </framerMotion.motion.div>
                )}

                {mode === "register" && (
                  <framerMotion.motion.div
                    key="register"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit((data) =>
                          registerMutation.mutate(data)
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input {...field} className="pl-10" />
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input {...field} type="email" className="pl-10" />
                                  <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    {...field}
                                    className="pl-10 pr-10"
                                  />
                                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <PasswordStrengthMeter password={field.value} />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    {...field}
                                    className="pl-10"
                                  />
                                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create account"}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setMode("login")}
                        >
                          Already have an account? Sign in
                        </Button>
                      </form>
                    </Form>
                  </framerMotion.motion.div>
                )}

                {mode === "forgot" && (
                  <framerMotion.motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Form {...forgotPasswordForm}>
                      <form
                        onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
                        className="space-y-4"
                      >
                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input {...field} type="email" className="pl-10" />
                                  <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full">
                          Reset password
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setMode("login")}
                        >
                          Back to sign in
                        </Button>
                      </form>
                    </Form>
                  </framerMotion.motion.div>
                )}
              </framerMotion.AnimatePresence>
            </CardContent>
          </Card>
        </framerMotion.motion.div>
      </div>

      <div className="hidden lg:block flex-1 bg-[#C41230] p-12">
        <div className="h-full flex flex-col justify-center text-white">
          <framerMotion.motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold mb-6">
              UniGroup by EdZen AI
            </h1>
            <p className="text-lg">
              Create balanced and diverse student groups automatically using our
              AI-powered algorithm. Manage forms, track submissions, and adjust groups
              with ease.
            </p>
          </framerMotion.motion.div>
        </div>
      </div>
    </div>
  );
}