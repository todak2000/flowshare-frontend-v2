// app/jv-partner/dashboard/page.tsx
export default function JVPartnerDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">JV Partner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Your Allocated Volume</h2>
          <p className="text-3xl font-bold">450 bbl</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Last Allocation</h2>
          <p className="text-gray-600">April 5, 2025</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Your Share</h2>
          <p className="text-3xl font-bold">39.13%</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Allocation History</h2>
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Input Volume</th>
              <th className="px-4 py-2 text-left">Allocated Volume</th>
              <th className="px-4 py-2 text-left">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">April 5, 2025</td>
              <td className="px-4 py-2">100 bbl</td>
              <td className="px-4 py-2">90 bbl</td>
              <td className="px-4 py-2">39.13%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}