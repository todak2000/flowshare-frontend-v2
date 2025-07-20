/* eslint-disable @typescript-eslint/no-explicit-any */
// app/login/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseService } from "../../../../lib/firebase-service";

// Define UserRole type locally or import from your types
type UserRole =
  | "field_operator"
  | "admin"
  | "jv_coordinator"
  | "auditor"
  | "jv_partner";

interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
  company: string;
  permissions: string[];
}

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
      const data = await firebaseService.loginUser({ email, password });

      if (!data.token) {
        setError("AN error occured");
        return;
      }
      // Save token and user role in localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: data.userId,
          email: data.email,
          role: data.role,
          company: data.company,
          permissions: data.permissions,
        })
      );

      // Redirect based on role
      switch (data.role) {
        case "field_operator":
          router.push("/onboarding/field-operator");
          break;
        case "admin":
          router.push("/onboarding/admin");
          break;
        case "jv_coordinator":
          router.push("/onboarding/jv-coordinator");
          break;
        case "auditor":
          router.push("/onboarding/auditor");
          break;
        case "jv_partner":
          router.push("/onboarding/jv-partner");
          break;
        default:
          router.push("/onboarding/login");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p>
            Don&#39;t have an account?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
