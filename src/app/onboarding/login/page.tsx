/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/onboarding/login/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseService } from "../../../../lib/firebase-service";
import { UserRole } from "../../../../types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
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
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter your email"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter your password"
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
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don&lsquo;t have an account?{" "}
            <button
              onClick={() => router.push("/onboarding/register")}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Create one here
            </button>
          </p>
        </div>

        {/* Demo Users Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Demo Accounts</h3>
          <div className="space-y-2">
            {[
              { role: "Field Operator", email: "operator@demo.com" },
              { role: "JV Coordinator", email: "coordinator@demo.com" },
              { role: "JV Partner", email: "partner@demo.com" },
              { role: "Auditor", email: "auditor@demo.com" }
            ].map((demo) => (
              <button
                key={demo.email}
                onClick={() => handleDemoLogin(demo.email)}
                className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-white p-2 rounded transition"
              >
                <strong>{demo.role}:</strong> {demo.email} / demo123
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click on any account to auto-fill the form
          </p>
        </div>
      </div>
    </div>
  );
}