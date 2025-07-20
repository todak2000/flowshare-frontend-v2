// app/field-operator/dashboard/page.tsx
export default function FieldOperatorDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Field Operator Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Your Daily Entries</h2>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Total Volume Submitted</h2>
          <p className="text-3xl font-bold">1,200 bbl</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Last Entry</h2>
          <p className="text-gray-600">April 5, 2025</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          Recent Production Entries
        </h2>
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Volume</th>
              <th className="px-4 py-2 text-left">BS&W</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">April 5, 2025</td>
              <td className="px-4 py-2">100 bbl</td>
              <td className="px-4 py-2">2.5%</td>
              <td className="px-4 py-2">Submitted</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
