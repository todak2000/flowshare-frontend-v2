// app/onboarding/auditor/page.tsx
export default function AuditorOnboarding() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome, Auditor</h1>
      <p className="mb-4">
        You have read-only access to verify data integrity and review audit logs.
      </p>
      <div className="bg-blue-50 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Your Tasks</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review production and allocation history</li>
          <li>Verify data hashes</li>
          <li>Access audit logs</li>
        </ul>
      </div>
      <div className="mt-6">
        <a href="/audit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          View Audit Logs
        </a>
      </div>
    </div>
  );
}