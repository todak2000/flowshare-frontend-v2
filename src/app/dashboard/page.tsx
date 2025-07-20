// app/dashboard/page.tsx
import React from "react";

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Hydrocarbon Accounting Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Total Production</h2>
          <p className="text-3xl font-bold">250 bbl</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Terminal Volume</h2>
          <p className="text-3xl font-bold">230 bbl</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold">Shrinkage</h2>
          <p className="text-3xl font-bold">8.7%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Allocation Results</h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Partner</th>
              <th className="px-4 py-2 text-left">Input (bbl)</th>
              <th className="px-4 py-2 text-left">Net (bbl)</th>
              <th className="px-4 py-2 text-left">Allocated (bbl)</th>
              <th className="px-4 py-2 text-left">% Share</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">Company A</td>
              <td className="px-4 py-2">100</td>
              <td className="px-4 py-2">95</td>
              <td className="px-4 py-2">90</td>
              <td className="px-4 py-2">39.13%</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Company B</td>
              <td className="px-4 py-2">150</td>
              <td className="px-4 py-2">140</td>
              <td className="px-4 py-2">140</td>
              <td className="px-4 py-2">60.87%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
