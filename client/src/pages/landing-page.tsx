import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Users, Brain, Gauge } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                UniGroup by{" "}
                <span className="text-primary">EdZen AI™</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your classroom dynamics with AI-powered group formation and seamless Canvas integration. The future of collaborative learning is here.
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={() => setLocation("/auth")}>
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
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#662D91]/30 via-[#F7941D]/20 to-[#8DC63F]/10 rounded-2xl blur-2xl" />
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