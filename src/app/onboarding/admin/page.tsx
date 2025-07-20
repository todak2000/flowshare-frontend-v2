// app/onboarding/admin/page.tsx
export default function AdminOnboarding() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome, Admin</h1>
      <p className="mb-4">
        You have full administrative access to manage users and system settings.
      </p>
      <div className="bg-blue-50 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Your Tasks</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Manage user roles and permissions</li>
          <li>Review production and allocation data</li>
          <li>Trigger reconciliation manually</li>
        </ul>
      </div>
      <div className="mt-6">
        <a href="/admin/users" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Manage Users
        </a>
      </div>
    </div>
  );
}