import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Users, Brain, Gauge } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Animated Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#662D91]/5 to-[#8DC63F]/5" />

        {/* Animated Neural Network Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
            <div className="absolute left-0 top-0 h-[200%] w-[200%] animate-[spin_20s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,#662D91_15%,transparent_40%)]" />
            <div className="absolute right-0 bottom-0 h-[200%] w-[200%] animate-[spin_15s_linear_infinite] bg-[conic-gradient(from_180deg,transparent_0%,#F7941D_15%,transparent_40%)]" />
            <div className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_90deg,transparent_0%,#8DC63F_15%,transparent_40%)]" />
          </div>

          {/* Floating Nodes */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-4 w-4 rounded-full bg-white/30 backdrop-blur-sm"
              animate={{
                x: ["0%", "100%", "0%"],
                y: [`${30 + i * 10}%`, `${60 + i * 5}%`, `${30 + i * 10}%`],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
              className="text-white/10"
            >
              <path
                d="M.5 50V.5H50"
                fill="none"
                stroke="currentColor"
                strokeDasharray="4 4"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                UniGroup by{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#662D91] via-[#F7941D] to-[#8DC63F]">
                  EdZen AI™
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your classroom dynamics with AI-powered group formation and seamless Canvas integration. The future of collaborative learning is here.
              </p>
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  onClick={() => setLocation("/auth")}
                  className="bg-gradient-to-r from-[#662D91] to-[#F7941D] hover:opacity-90"
                >
                  Get Started Free
                  <ChevronRight className="ml-2 h-5 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-[#662D91] via-[#F7941D] to-[#8DC63F] p-1">
                  <div className="bg-white rounded-md h-full w-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="flex justify-center mb-4">
                        <Users className="h-16 w-16 text-[#662D91]" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Smart Group Formation</h3>
                      <p className="text-sm text-muted-foreground">Powered by Advanced AI</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose UniGroup?</h2>
            <p className="text-lg text-muted-foreground">
              Experience the power of AI-driven group formation that understands your students' needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-[#662D91]" />}
              title="AI-Powered Matching"
              description="Our advanced algorithms create balanced and effective student groups based on multiple criteria."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-[#F7941D]" />}
              title="Canvas Integration"
              description="Seamless LMS integration for effortless course management and student data synchronization."
            />
            <FeatureCard
              icon={<Gauge className="h-8 w-8 text-[#8DC63F]" />}
              title="Real-time Analytics"
              description="Track group performance and adjust parameters for optimal learning outcomes."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#662D91] text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join leading educators who are already using UniGroup to create more
            effective and engaging learning environments.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setLocation("/auth")}
          >
            Start Free Trial
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} UniGroup by EdZen AI™. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-background rounded-xl p-6 shadow-lg"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}