"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Shield,
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  Play,
  Settings,
  TrendingUp,
  Droplet,
  LucideProps,
} from "lucide-react";
import { Logo } from "./Logo";
import { useRouter } from "next/navigation";

// Import from constants
import { COLORS } from '../constants/ui';
export { COLORS };
export type { ColorShades, ColorGroup, ColorPalette } from '../constants/ui';

// --- Type Definitions ---

// Data Layer Types
interface StatItem {
  value: string;
  label: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}

interface FeatureItem {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  title: string;
  description: string;
}

interface WorkflowStepItem {
  step: string;
  title: string;
  description: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}

interface NavItem {
  label: string;
  href: string;
}

interface FooterLink {
  label: string;
  href: string;
}

interface LandingData {
  brand: {
    name: string;
    tagline: string;
    description: string;
  };
  navigation: NavItem[];
  stats: StatItem[];
  features: FeatureItem[];
  workflow: WorkflowStepItem[];
  footer: {
    links: FooterLink[];
    copyright: string;
  };
}

interface StatCardProps {
  stat: StatItem;
  index: number;
  isVisible: boolean;
}

interface FeatureCardProps {
  feature: FeatureItem;
  index: number;
  isActive: boolean;
}

interface WorkflowStepProps {
  step: WorkflowStepItem;
  index: number;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
}

// --- Data Layer ---
const LANDING_DATA: LandingData = {
  brand: {
    name: "FlowShare",
    tagline: "Next-Gen Hydrocarbon Management",
    description:
      "Transform your shared asset operations with transparent, real-time hydrocarbon volume tracking and instant reconciliation between joint venture partners.",
  },
  navigation: [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Login", href: "#login" },
  ],
  stats: [
    { value: "99.9%", label: "System Uptime", icon: TrendingUp },
    { value: "<1hr", label: "Reconciliation Time", icon: Zap },
    { value: "100%", label: "Data Integrity", icon: Shield },
    { value: "4+", label: "JV Partners", icon: Users },
  ],
  features: [
    {
      icon: Shield,
      title: "Transparent Allocation",
      description:
        "Real-time hydrocarbon volume tracking with immutable records",
    },
    {
      icon: Zap,
      title: "Instant Reconciliation",
      description:
        "Automated calculations reduce reconciliation time from days to minutes",
    },
    {
      icon: Users,
      title: "Multi-Partner Support",
      description: "Seamless collaboration between joint venture partners",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reporting and audit trails for compliance",
    },
  ],
  workflow: [
    {
      step: "01",
      title: "Production Entry",
      description:
        "Field operators input daily production data including volume, BS&W, temperature, and API Gravity through our intuitive interface.",
      icon: Settings,
    },
    {
      step: "02",
      title: "Terminal Receipt",
      description:
        "Terminal operators log final received volumes with environmental conditions, triggering the reconciliation process automatically.",
      icon: BarChart3,
    },
    {
      step: "03",
      title: "Smart Allocation",
      description:
        "Our engine applies industry-standard formulas to calculate net volumes and distribute fair shares to all JV partners.",
      icon: TrendingUp,
    },
  ],
  footer: {
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
      { label: "Support", href: "#support" },
    ],
    copyright:
      "© 2025 FlowShare. Revolutionizing hydrocarbon allocation through innovation.",
  },
};

const StatCard: React.FC<StatCardProps> = ({ stat, index, isVisible }) => {
  const IconComponent = stat.icon;
  return (
    <div
      className={`${COLORS.background.glass} backdrop-blur-sm ${
        COLORS.border.light
      } rounded-xl p-6 transition-all duration-700 hover:${
        COLORS.background.glassHover
      } ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      <div
        className={`flex items-center justify-center mb-3 ${COLORS.primary.blue[400]}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold mb-1">{stat.value}</div>
      <div className={`text-sm ${COLORS.text.muted}`}>{stat.label}</div>
    </div>
  );
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  index,
  isActive,
}) => {
  const IconComponent = feature.icon;
  return (
    <div
      className={`group ${COLORS.background.glass} backdrop-blur-sm ${
        COLORS.border.light
      } rounded-2xl p-8 hover:${
        COLORS.background.glassHover
      } transition-all duration-500 transform hover:scale-105 ${
        isActive
          ? `ring-2 ${COLORS.border.ring} ${COLORS.background.glassHover}`
          : ""
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center transition-all duration-300 ${
          isActive
            ? `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]}`
            : `${COLORS.background.glass} group-hover:bg-gradient-to-r group-hover:${COLORS.primary.blue[600]} group-hover:${COLORS.primary.purple[600]}`
        }`}
      >
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
      <p className={`${COLORS.text.muted} leading-relaxed`}>
        {feature.description}
      </p>
    </div>
  );
};

const WorkflowStep: React.FC<WorkflowStepProps> = ({ step, index }) => {
  const IconComponent = step.icon;
  return (
    <div className="relative">
      <div
        className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm ${COLORS.border.light} rounded-2xl p-8 hover:from-white/15 hover:to-white/10 transition-all duration-300`}
      >
        <div className="text-6xl font-bold text-blue-500/20 mb-4">
          {step.step}
        </div>
        <div
          className={`w-16 h-16 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} rounded-xl flex items-center justify-center mb-6`}
        >
          <IconComponent className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
        <p className={`${COLORS.text.muted} leading-relaxed`}>
          {step.description}
        </p>
      </div>
      {index < LANDING_DATA.workflow.length - 1 && (
        <div
          className={`hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r ${COLORS.primary.blue[500]} to-purple-500`}
        ></div>
      )}
    </div>
  );
};

export const AnimatedBackground: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full animate-pulse"></div>
    <div
      className="absolute top-40 right-20 w-16 h-16 bg-purple-500/20 rounded-full animate-bounce"
      style={{ animationDelay: "1s" }}
    ></div>
    <div
      className="absolute bottom-40 left-20 w-12 h-12 bg-cyan-500/20 rounded-full animate-pulse"
      style={{ animationDelay: "2s" }}
    ></div>
    <div
      className="absolute bottom-20 right-40 w-24 h-24 bg-indigo-500/20 rounded-full animate-bounce"
      style={{ animationDelay: "0.5s" }}
    ></div>
  </div>
);

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  ...props
}) => {
  const baseClasses =
    "px-8 py-4 cursor-pointer rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2";
  const variants = {
    primary: `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]}`,
    secondary: `border ${COLORS.border.light} hover:${COLORS.background.glassHover}`,
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Main Component ---
const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const { push } = useRouter();
  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Apply font styles (optional, can also be done via CSS)
    document.body.style.fontFamily = "'Inter', sans-serif";

    setIsVisible(true);

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % LANDING_DATA.features.length);
    }, 3000);

    return () => {
      clearInterval(interval);
      document.head.removeChild(link);
    };
  }, []);

  // Smooth scroll utility
  const smoothScrollTo = (elementId: string): void => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleGetStarted = () => {
    push("/onboarding/register");
  };
  const handleLogin = () => {
    push("/onboarding/login");
  };

  return (
    <div
      className={`min-h-screen ${COLORS.background.gradient} ${COLORS.text.primary} overflow-hidden`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 bg-transparent backdrop-blur-md transition-all duration-700 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center space-x-8">
              {LANDING_DATA.navigation.map((item) => (
                <button
                  key={item.label}
                  onClick={
                    item.label === "Login"
                      ? handleLogin
                      : () => smoothScrollTo(item.href.slice(1))
                  }
                  className={`hover:${COLORS.primary.blue[400]} transition-colors cursor-pointer`}
                >
                  {item.label}
                </button>
              ))}
              <Button onClick={handleGetStarted} variant="primary">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen mt-[72px] flex items-center justify-center px-6">
        <AnimatedBackground />
        <div
          className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="mb-6">
            <span
              className={`inline-block px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full text-sm ${COLORS.border.blue}`}
            >
              🚀 {LANDING_DATA.brand.tagline}
            </span>
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span
              className={`bg-gradient-to-r ${COLORS.primary.blue[50]} via-purple-400 ${COLORS.primary.cyan[400]} bg-clip-text text-transparent`}
            >
              Revolutionize
            </span>
            <br />
            <span className={COLORS.text.primary}>Oil & Gas Allocation</span>
          </h1>
          <p
            className={`text-xl md:text-2xl ${COLORS.text.secondary} mb-8 max-w-3xl mx-auto leading-relaxed`}
          >
            {LANDING_DATA.brand.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="primary" onClick={() => push("/demo")}>
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button onClick={() => push("/demo")} variant="secondary">
              <Play className="w-5 h-5" />
              <span>Checkout Demo</span>
            </Button>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {LANDING_DATA.stats.map((stat, index) => (
              <StatCard
                key={index}
                stat={stat}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
        {/* Scroll indicator */}
        <button
          onClick={() => smoothScrollTo("features")}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
        >
          <ChevronDown className={`w-6 h-6 ${COLORS.text.muted}`} />
        </button>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span
                className={`bg-gradient-to-r ${COLORS.primary.blue[50]} ${COLORS.primary.purple[400]} bg-clip-text text-transparent`}
              >
                Powerful Features
              </span>
            </h2>
            <p className={`text-xl ${COLORS.text.secondary} max-w-3xl mx-auto`}>
              Built for the modern oil & gas industry, our platform delivers
              transparency, efficiency, and trust in every transaction.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {LANDING_DATA.features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                index={index}
                isActive={activeFeature === index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className={`py-20 px-6 ${COLORS.background.overlay}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              How{" "}
              <span
                className={`bg-gradient-to-r ${COLORS.primary.blue[50]} ${COLORS.primary.purple[400]} bg-clip-text text-transparent`}
              >
                {LANDING_DATA.brand.name}
              </span>{" "}
              Works
            </h2>
            <p className={`text-xl ${COLORS.text.secondary} max-w-3xl mx-auto`}>
              Streamlined workflow from production entry to final allocation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {LANDING_DATA.workflow.map((step, index) => (
              <WorkflowStep key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              Join leading oil & gas companies already using{" "}
              {LANDING_DATA.brand.name} to streamline their hydrocarbon
              allocation processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" onClick={handleGetStarted}>
                Start Your Free Trial
              </Button>
              <Button variant="secondary">Schedule Demo</Button>
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
              {LANDING_DATA.footer.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`${COLORS.text.muted} hover:${COLORS.text.primary} transition-colors`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className={`mt-6 text-center ${COLORS.text.muted}`}>
            <p>{LANDING_DATA.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
