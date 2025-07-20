// app/onboarding/jv-partner/page.tsx
export default function JVPartnerOnboarding() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome, JV Partner</h1>
      <p className="mb-4">
        You can view your allocated volumes and download reports.
      </p>
      <div className="bg-blue-50 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Your Tasks</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>View your allocated volumes</li>
          <li>Download allocation reports</li>
        </ul>
      </div>
      <div className="mt-6">
        <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          View Dashboard
        </a>
      </div>
    </div>
  );
}