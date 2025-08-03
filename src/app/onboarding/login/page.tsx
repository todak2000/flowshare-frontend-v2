/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { AnimatedBackground, COLORS } from "../../../../component/Home";
import { Logo } from "../../../../component/Logo";
import { InputField } from "../../../../component/InputField";
import { firebaseService } from "../../../../lib/firebase-service";
import { UserRole } from "../../../../types";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "demo";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

interface ErrorAlertProps {
  message: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props
}) => {
  const baseClasses =
    "w-full py-3 px-4 cursor-pointer rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
  const variants = {
    primary: `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]} text-white focus:${COLORS.border.ring}`,
    secondary: `${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border ${COLORS.text.primary} hover:${COLORS.background.glassHover}`,
    demo: `${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border hover:${COLORS.background.glassHover} ${COLORS.text.primary} text-left`,
  };
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Signing in...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
    <div className="flex">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="ml-3">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  </div>
);

// --- Main Login Component ---
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    document.body.style.fontFamily = "'Inter', sans-serif";
    setIsVisible(true);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use existing firebaseService.loginUser method
      const loginResult = await firebaseService.loginUser({ email, password });

      // Save user data to localStorage for easy access
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: loginResult.userId,
          email: loginResult.email,
          role: loginResult.role,
          company: loginResult.company,
          permissions: loginResult.permissions,
        })
      );

      // Redirect based on role
      const role = loginResult.role as UserRole;
      switch (role) {
        case "field_operator":
          router.push("/dashboard/field-operator");
          break;
        case "admin":
        case "jv_coordinator":
          router.push("/dashboard/jv-coordinator");
          break;
        case "jv_partner":
          router.push("/dashboard/jv-partner");
          break;
        case "auditor":
          router.push("/dashboard/auditor");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${COLORS.background.gradient} flex items-center justify-center px-4 relative`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <AnimatedBackground />
      <div
        className={`max-w-md w-full ${
          COLORS.background.card
        } backdrop-blur-xl ${
          COLORS.border.light
        } border rounded-2xl p-8 shadow-2xl transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <Logo />
        <div className="text-center mb-8">
          <h2
            className={`text-2xl font-bold ${COLORS.text.primary} mb-2`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Welcome Back
          </h2>
          <p className={COLORS.text.secondary}>
            Sign in to your FlowShare account
          </p>
          <div className="mt-3 text-center text-xs ">
            <p className={COLORS.text.secondary}>
              Go to the {" "}
              <button
                type="button" // Added type
                onClick={() => router.push("/demo")}
                className={` text-yellow-400 hover:text-yellow-700 cursor-pointer font-medium hover:underline transition-colors`}
              >
                demo page
              </button>{" "}
              to get demo login details
            </p>
          </div>
        </div>
        {error && <ErrorAlert message={error} />}
        <form onSubmit={handleLogin} className="space-y-6">
          <InputField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            icon={Mail}
            disabled={loading}
            error={!!error}
          />
          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${COLORS.text.primary}`}
            >
              Password
            </label>
            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
              >
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                className={`
                  w-full pl-10 pr-12 py-3
                  ${COLORS.background.glass} backdrop-blur-sm
                  ${error ? "border-red-500/50" : COLORS.border.light}
                  border rounded-xl
                  ${COLORS.text.primary}
                  placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:${
                    COLORS.border.ring
                  } focus:border-transparent
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute cursor-pointer inset-y-0 right-0 pr-3 flex items-center ${COLORS.text.muted} hover:${COLORS.text.secondary} transition-colors`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit" // Changed to submit type
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            {!loading && (
              <div className="flex items-center justify-center space-x-2">
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <p className={COLORS.text.secondary}>
            Don&#39;t have an account?{" "}
            <button
              type="button" // Added type
              onClick={() => router.push("/onboarding/register")}
              className={`${COLORS.primary.blue[400]} hover:text-purple-400 cursor-pointer font-medium hover:underline transition-colors`}
            >
              Create one here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
