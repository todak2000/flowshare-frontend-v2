/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  User,
  Building,
  Users,
  Settings,
  CheckCircle,
} from "lucide-react";
import { AnimatedBackground, COLORS } from "../../../../component/Home";
import { Logo } from "../../../../component/Logo";
import { firebaseService } from "../../../../lib/firebase-service";

// TypeScript Interfaces
interface User {
  uid: string;
  email: string;
  role: UserRole;
  company: string;
  permissions: Permission[];
}


interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | string;
  company: string;
}

interface RoleOption {
  value: UserRole | string;
  label: string;
  company: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  permissions: string[];
}

type UserRole =
  | "field_operator"
  | "admin"
  | "jv_coordinator"
  | "jv_partner"
  | "auditor";
type Permission =
  | "view_production_data"
  | "create_production_entry"
  | "edit_production_entry"
  | "create_terminal_receipt"
  | "trigger_reconciliation"
  | "view_allocation_results"
  | "view_audit_logs";
type ButtonVariant = "primary" | "secondary" | "demo";

// Role options data
const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "",
    label: "Select Role",
    company: "",
    icon: Settings,
    description: "Enter daily production data",
    permissions: ["Production Entry", "Data Viewing"],
  },
  {
    value: "field_operator",
    label: "Field Operator",
    company: "",
    icon: Settings,
    description: "Enter daily production data",
    permissions: ["Production Entry", "Data Viewing"],
  },
  {
    value: "jv_coordinator",
    label: "JV Coordinator",
    company: "",
    icon: Users,
    description: "Manage terminal receipts & reconciliation",
    permissions: ["Full Access", "Reconciliation", "Reports"],
  },
  {
    value: "jv_partner",
    label: "JV Partner",
    company: "",
    icon: User,
    description: "View allocation results & reports",
    permissions: ["Allocation View", "Reports"],
  },
  // {
  //   value: "auditor",
  //   label: "Auditor",
  //   company: "Audit Solutions Inc",
  //   icon: Shield,
  //   description: "Review data integrity & compliance",
  //   permissions: ["Audit Logs", "Compliance", "Reports"],
  // },
];

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  minLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled = false,
  error = false,
  required = false,
  minLength,
}) => (
  <div className="space-y-2">
    <label className={`block text-sm font-medium ${COLORS.text.primary}`}>
      {label}
    </label>
    <div className="relative">
      <div
        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        className={`
          w-full pl-10 pr-4 py-3 
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
      />
    </div>
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: RoleOption[];
  disabled?: boolean;
  error?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  error = false,
}) => (
  <div className="space-y-2">
    <label
      className={`block cursor-pointer text-sm font-medium ${COLORS.text.primary}`}
    >
      {label}
    </label>
    <div className="relative">
      <div
        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
      >
        <User className="h-5 w-5" />
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full pl-10 pr-4 py-3 cursor-pointer
          ${COLORS.background.glass} backdrop-blur-sm 
          ${error ? "border-red-500/50" : COLORS.border.light} 
          border rounded-xl 
          ${COLORS.text.primary} 
          focus:outline-none focus:ring-2 focus:${
            COLORS.border.ring
          } focus:border-transparent 
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none
        `}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-slate-800 text-white cursor-pointer"
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.FormEvent) => Promise<void>;
  className?: string;
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
    "w-full cursor-pointer py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";

  const variants: Record<ButtonVariant, string> = {
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
          Creating account...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

interface ErrorAlertProps {
  message: string;
}

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

interface RoleInfoCardProps {
  selectedRole: UserRole;
}

const RoleInfoCard: React.FC<RoleInfoCardProps> = ({ selectedRole }) => {
  const roleInfo = ROLE_OPTIONS.find((role) => role.value === selectedRole);
  if (!roleInfo) return null;

  const IconComponent = roleInfo.icon;

  return (
    <div
      className={`mt-6 p-4 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`w-10 h-10 rounded-lg ${COLORS.background.glassHover} flex items-center justify-center`}
        >
          <IconComponent className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3
            className={`text-sm font-semibold ${COLORS.text.primary} mb-1 flex items-center`}
          >
            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
            {roleInfo.label}
          </h3>
          <p className={`text-xs ${COLORS.text.muted} mb-2`}>
            {roleInfo.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {roleInfo.permissions.map((permission, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Register Component
const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    company: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getPermissionsForRole = (role: UserRole): Permission[] => {
    switch (role) {
      case "field_operator":
        return ["view_production_data", "create_production_entry"];
      case "jv_coordinator":
      case "admin":
        return [
          "view_production_data",
          "create_production_entry",
          "edit_production_entry",
          "create_terminal_receipt",
          "trigger_reconciliation",
          "view_allocation_results",
        ];
      case "jv_partner":
        return ["view_production_data", "view_allocation_results"];
      case "auditor":
        return [
          "view_production_data",
          "view_audit_logs",
          "view_allocation_results",
        ];
      default:
        return ["view_production_data"];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!formData.company.trim()) {
      setError("Company name is required.");
      setLoading(false);
      return;
    }

    try {
      // Use existing firebaseService.createUserInFirestore method
      const registrationResult = await firebaseService.createUserInFirestore({
        email: formData.email,
        password: formData.password,
        role: formData.role as UserRole,
        company: formData.company.trim(),
        permissions: getPermissionsForRole(formData.role as UserRole),
        active: true,
      });

      // Save user data to localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: registrationResult.uid,
          email: registrationResult.email,
          role: registrationResult.role,
          company: registrationResult.company,
          permissions: registrationResult.permissions,
        })
      );

      // Redirect to appropriate dashboard
      switch (formData.role) {
        case "field_operator":
          router.push("/dashboard/field-operator");
          break;
        case "jv_coordinator":
        case "admin":
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
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const role = e.target.value as UserRole;
    const selectedRole = ROLE_OPTIONS.find((option) => option.value === role);
    setFormData((prev) => ({
      ...prev,
      role,
      company: selectedRole?.company || "",
    }));
  };

  return (
    <div
      className={`min-h-screen ${COLORS.background.gradient} flex items-center justify-center px-4 py-8 relative`}
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
            className={`text-2xl font-bold ${COLORS.text.primary} mb-2 font-display`}
          >
            Create Account
          </h2>
          <p className={COLORS.text.secondary}>Join the FlowShare platform</p>
        </div>
        {/* Role Information */}
        {formData.role !== "" ? (
          <RoleInfoCard selectedRole={formData.role as UserRole} />
        ) : (
          ""
        )}
        {error && <ErrorAlert message={error} />}

        <div className="space-y-6 mt-6">
          <InputField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter your email"
            icon={Mail}
            disabled={loading}
            error={!!error}
            required
          />

          <SelectField
            label="Role"
            value={formData.role}
            onChange={handleRoleChange}
            options={ROLE_OPTIONS}
            disabled={loading}
            error={!!error}
          />

          <InputField
            label="Company Name"
            type="text"
            value={formData.company}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, company: e.target.value }))
            }
            placeholder="Enter your company name"
            icon={Building}
            disabled={loading}
            error={!!error}
            required
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
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter your password"
                disabled={loading}
                minLength={6}
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
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              className={`block text-sm font-medium ${COLORS.text.primary}`}
            >
              Confirm Password
            </label>
            <div className="relative">
              <div
                className={`absolute  inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
              >
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm your password"
                disabled={loading}
                minLength={6}
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute cursor-pointer inset-y-0 right-0 pr-3 flex items-center ${COLORS.text.muted} hover:${COLORS.text.secondary} transition-colors`}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            {!loading && (
              <div className="flex items-center justify-center space-x-2">
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className={COLORS.text.secondary}>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/onboarding/login")}
              className={`${COLORS.primary.blue[400]} hover:text-purple-400 cursor-pointer font-medium hover:underline transition-colors`}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
