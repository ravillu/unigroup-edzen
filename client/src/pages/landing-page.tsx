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
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
            {/* Neural Network Animation */}
            <div className="absolute inset-0">
              {/* Floating Nodes */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-4 w-4 rounded-full bg-gradient-to-r from-[#662D91] to-[#F7941D] opacity-40 shadow-lg"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 100 - 50, 0],
                    y: [0, Math.random() * 100 - 50, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 10 + Math.random() * 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Connecting Lines */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`line-${i}`}
                  className="absolute h-px bg-gradient-to-r from-[#662D91]/20 via-[#F7941D]/20 to-[#8DC63F]/20"
                  style={{
                    width: '200%',
                    left: '-50%',
                    top: `${(i * 100) / 20}%`,
                    transform: 'rotate(35deg)',
                  }}
                  animate={{
                    translateX: ['-20%', '20%', '-20%'],
                  }}
                  transition={{
                    duration: 8 + i * 0.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Logo Header */}
          <div className="flex justify-center mb-16">
            <motion.img
              src="/images/logo.jpg"
              alt="EdZen AI Logo"
              className="h-24 object-contain"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                UniGroup by{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#662D91] via-[#F7941D] to-[#8DC63F]">
                  EdZen AI™
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your classroom dynamics with AI-powered group formation and seamless Canvas integration. Experience the future of collaborative learning.
              </p>
              <Button
                size="lg"
                onClick={() => setLocation("/auth")}
                className="bg-[#662D91] hover:bg-[#662D91]/90 text-white"
              >
                Get Started Free
                <ChevronRight className="ml-2 h-5 w-4" />
              </Button>
            </motion.div>

            {/* Feature Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-[#662D91]/10">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-[#662D91] to-[#F7941D] p-[2px]">
                  <div className="bg-white rounded-md h-full w-full flex items-center justify-center p-8">
                    <div className="text-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Brain className="h-20 w-20 text-[#662D91] mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold mb-2">AI-Powered Matching</h3>
                      <p className="text-muted-foreground">
                        Our intelligent algorithms create perfectly balanced student groups
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-white to-[#662D91]/5 py-24">
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
              title="Smart Matching"
              description="Advanced algorithms create balanced and effective student groups based on multiple criteria."
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
      <div className="bg-[#662D91] py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
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
            className="bg-white text-[#662D91] hover:bg-white/90"
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
            <img
              src="/images/logo.jpg"
              alt="EdZen AI Logo"
              className="h-12 mx-auto mb-4"
            />
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
      className="bg-white rounded-xl p-8 shadow-lg border border-[#662D91]/10"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}