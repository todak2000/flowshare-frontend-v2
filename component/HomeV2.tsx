"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "../constants/ui";
import { Logo } from "./Logo";

// Import modular sections
import {
  HeroSection,
  ProblemSection,
  FeaturesSection,
  WorkflowSection,
  TestimonialsSection,
  RoleBasedValueSection,
  FAQSection,
  ROICalculator,
} from "./landing";

/**
 * New modular landing page with improved conversion optimization
 * Following KISS and DRY principles
 */
const LandingPageV2: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    document.body.style.fontFamily = "'Inter', sans-serif";

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Navigation handlers
  const handleGetStarted = () => router.push("/onboarding/register");
  const handleLogin = () => router.push("/onboarding/login");
  const handleDemo = () => router.push("/demo");

  const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className={`min-h-screen ${COLORS.background.gradient} ${COLORS.text.primary} overflow-hidden`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => smoothScrollTo("features")}
                className={`hover:${COLORS.primary.blue[400]} transition-colors cursor-pointer`}
              >
                Features
              </button>
              <button
                onClick={() => smoothScrollTo("how-it-works")}
                className={`hover:${COLORS.primary.blue[400]} transition-colors cursor-pointer`}
              >
                How it Works
              </button>
              <button
                onClick={() => smoothScrollTo("roi-calculator")}
                className={`hover:${COLORS.primary.blue[400]} transition-colors cursor-pointer`}
              >
                ROI Calculator
              </button>
              <button
                onClick={handleLogin}
                className={`hover:${COLORS.primary.blue[400]} transition-colors cursor-pointer`}
              >
                Login
              </button>
              <button
                onClick={handleGetStarted}
                className={`px-8 py-4 cursor-pointer rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]}`}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection
        onGetStarted={handleGetStarted}
        onDemo={handleDemo}
        onScrollToFeatures={() => smoothScrollTo("features")}
      />

      {/* Problem Section */}
      <ProblemSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Workflow Section */}
      <WorkflowSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Role-Based Value Section */}
      <RoleBasedValueSection />

      {/* ROI Calculator */}
      <ROICalculator onScheduleDemo={handleDemo} />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className={`bg-gradient-to-r from-blue-600/10 to-purple-600/10 ${COLORS.border.blue.replace(
              "border-blue-500/30",
              "border-blue-500/20"
            )} rounded-3xl p-12`}
          >
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to{" "}
              <span
                className={`bg-gradient-to-r ${COLORS.primary.blue[50]} ${COLORS.primary.purple[400]} bg-clip-text text-transparent`}
              >
                Transform
              </span>{" "}
              Your Operations?
            </h2>
            <p
              className={`text-xl ${COLORS.text.secondary} mb-8 max-w-2xl mx-auto`}
            >
              Join leading oil & gas companies already using FlowShare to
              streamline their hydrocarbon allocation processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className={`px-8 py-4 cursor-pointer rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]}`}
              >
                Start Your Free Trial
              </button>
              <button
                onClick={handleDemo}
                className={`px-8 py-4 cursor-pointer rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 border ${COLORS.border.light} hover:${COLORS.background.glassHover}`}
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-6 border-t ${COLORS.border.light}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo />
            <div className="flex items-center space-x-6 mt-6 md:mt-0">
              <a
                href="#privacy"
                className={`${COLORS.text.muted} hover:${COLORS.text.primary} transition-colors`}
              >
                Privacy
              </a>
              <a
                href="#terms"
                className={`${COLORS.text.muted} hover:${COLORS.text.primary} transition-colors`}
              >
                Terms
              </a>
              <a
                href="#support"
                className={`${COLORS.text.muted} hover:${COLORS.text.primary} transition-colors`}
              >
                Support
              </a>
            </div>
          </div>
          <div className={`mt-6 text-center ${COLORS.text.muted}`}>
            <p>
              © 2025 FlowShare. Revolutionizing hydrocarbon allocation through
              innovation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageV2;
