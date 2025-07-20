/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/onboarding/register/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseService } from "../../../../lib/firebase-service";
import { UserRole, Permission } from "../../../../types";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "field_operator" as UserRole,
    company: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: "field_operator", label: "Field Operator", company: "Alpha Energy" },
    { value: "jv_coordinator", label: "JV Coordinator", company: "Joint Venture Corp" },
    { value: "jv_partner", label: "JV Partner", company: "Beta Oil Co" },
    { value: "auditor", label: "Auditor", company: "Audit Solutions Inc" },
  ];

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
          "view_allocation_results"
        ];
      case "jv_partner":
        return ["view_production_data", "view_allocation_results"];
      case "auditor":
        return ["view_production_data", "view_audit_logs", "view_allocation_results"];
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
        role: formData.role,
        company: formData.company.trim(),
        permissions: getPermissionsForRole(formData.role),
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

  const handleRoleChange = (role: UserRole) => {
    const selectedRole = roleOptions.find(option => option.value === role);
    setFormData(prev => ({
      ...prev,
      role,
      company: selectedRole?.company || ""
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join the oil & gas allocation system</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              disabled={loading}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter your company name"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/onboarding/login")}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Role Information */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Role Descriptions</h3>
          <div className="space-y-1 text-xs text-blue-700">
            <div><strong>Field Operator:</strong> Enter daily production data</div>
            <div><strong>JV Coordinator:</strong> Manage terminal receipts & reconciliation</div>
            <div><strong>JV Partner:</strong> View allocation results & reports</div>
            <div><strong>Auditor:</strong> Review data integrity & compliance</div>
          </div>
        </div>
      </div>
    </div>
  );
}