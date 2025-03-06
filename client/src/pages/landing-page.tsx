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
              <img src="/attached_assets/Edzen_AI.jpg" alt="Edzen AI Logo" className="h-16 mb-8" />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Innovative Education,{" "}
                <span className="text-primary">Driven by AI</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your classroom dynamics with AI-powered group formation and seamless Canvas integration.
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={() => setLocation("/auth")}>
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8">
                <img
                  src="/attached_assets/Edzen_AI.jpg"
                  alt="Platform Preview"
                  className="rounded-xl shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Edzen AI?</h2>
            <p className="text-lg text-muted-foreground">
              Revolutionize your teaching experience with our cutting-edge features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-8 w-8 text-primary" />}
              title="AI-Powered Grouping"
              description="Intelligent algorithms create balanced and effective student groups based on multiple criteria."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="Smart Integration"
              description="Seamless Canvas LMS integration for effortless course management and student data synchronization."
            />
            <FeatureCard
              icon={<Gauge className="h-8 w-8 text-primary" />}
              title="Real-time Analytics"
              description="Track group performance and adjust parameters for optimal learning outcomes."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-primary-foreground py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join leading educators who are already using Edzen AI to create more
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
