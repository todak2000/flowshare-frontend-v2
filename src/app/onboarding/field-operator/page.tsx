"use client";
import { useUser } from "../../../../hook/useUser";

// app/onboarding/field-operator/page.tsx
export default function FieldOperatorOnboarding() {
  const { data, loading } = useUser();

  // Loading state with Tailwind spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has field_operator role
  if (data?.role !== "field_operator") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Access Denied
          </h2>
          <p className="text-red-600">
            You don&#39;t have permission to access this page. Only field
            operators can view this content.
          </p>
        </div>
      </div>
    );
  }

  // Main component content for authorized field operators
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome, Field Operator</h1>
      <p className="mb-4">
        You&#39;re authorized to enter daily production data for your company:
        {' '}{data.company}.
      </p>
      <div className="bg-blue-50 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Your Tasks</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Enter production data for your company</li>
          <li>View your company&#39;s contributions</li>
        </ul>
      </div>
      <div className="mt-6">
        <a
          href="/production"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Start Entering Data
        </a>
      </div>
    </div>
  );
}
