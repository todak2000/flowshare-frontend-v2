// app/onboarding/jv-coordinator/page.tsx
export default function JVCoordinatorOnboarding() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome, JV Coordinator</h1>
      <p className="mb-4">
        You are responsible for recording terminal receipts and triggering reconciliations.
      </p>
      <div className="bg-blue-50 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Your Tasks</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Record terminal receipts</li>
          <li>Trigger daily reconciliation</li>
          <li>Review allocation results</li>
        </ul>
      </div>
      <div className="mt-6">
        <a href="/terminal" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Record Terminal Receipt
        </a>
      </div>
    </div>
  );
}