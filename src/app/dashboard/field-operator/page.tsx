// src/app/dashboard/field-operator/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../../hook/useUser";
import { firebaseService } from "../../../../lib/firebase-service";
import { ProductionEntry, CreateProductionEntryData } from "../../../../types";
import LoadingSpinner from "../../../../component/LoadingSpinner";
import SummaryCard from "../../../../component/SummaryCard";
import Modal from "../../../../component/Modal";
import {
  FormField,
  FormFieldConfig,
  ProductionFormData,
} from "../../../../component/formField";
import { permissionsList } from "../../../../constants";

export default function FieldOperatorDashboard() {
  const { auth, data: userData, loading: userLoading } = useUser();

  const router = useRouter();
  const [productionData, setProductionData] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ProductionFormData>({
    temperature_degF: "",
    pressure_psi: "",
    bsw_percent: "",
    gross_volume_bbl: "",
  });

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }

    // if (userData?.role !== 'field_operator') {
    //   router.push('/dashboard');
    //   return;
    // }

    if (userData?.company) {
      loadTodaysData();
    }
  }, [userLoading, auth, userData, router]);

  const loadTodaysData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const data = await firebaseService.getProductionEntries(
        userData?.company,
        startOfDay,
        endOfDay
      );
      setProductionData(data);
    } catch (error) {
      console.error("Error loading production data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formFields: FormFieldConfig[] = [
    {
      id: "temperature",
      key: "temperature_degF",
      label: "Temperature",
      unit: "°F",
      placeholder: "Enter temperature in Fahrenheit",
    },
    {
      id: "pressure",
      key: "pressure_psi",
      label: "Pressure",
      unit: "PSI",
      placeholder: "Enter pressure in PSI",
    },
    {
      id: "bsw",
      key: "bsw_percent",
      label: "Basic Sediment and Water",
      unit: "%",
      placeholder: "Enter BSW percentage",
    },
    {
      id: "production",
      key: "gross_volume_bbl",
      label: "Production Volume",
      unit: "BBL",
      placeholder: "Enter volume in barrels",
    },
  ];

  const handleInputChange = (key: keyof ProductionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!userData?.permissions.includes(permissionsList.canCreateProd)) {
      alert("You are not authorized to perform this operation");
      return;
    }

    setLoading(true);
    try {
      const submissionData: CreateProductionEntryData = {
        partner: userData.company,
        gross_volume_bbl: parseFloat(formData.gross_volume_bbl),
        bsw_percent: parseFloat(formData.bsw_percent),
        temperature_degF: parseFloat(formData.temperature_degF),
        pressure_psi: parseFloat(formData.pressure_psi),
        timestamp: new Date(),
        created_by: auth.uid,
      };

      await firebaseService.createProductionEntry(submissionData);
      setShowForm(false);
      setFormData({
        temperature_degF: "",
        pressure_psi: "",
        bsw_percent: "",
        gross_volume_bbl: "",
      });
      await loadTodaysData();
    } catch (error) {
      console.error("Error saving production entry:", error);
      alert("Error saving production data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const todaysTotal = productionData.reduce(
    (sum, entry) => sum + entry.gross_volume_bbl,
    0
  );
  const averageBSW =
    productionData.length > 0
      ? productionData.reduce((sum, entry) => sum + entry.bsw_percent, 0) /
        productionData.length
      : 0;

  if (userLoading) {
    return <LoadingSpinner fullScreen message="Loading user data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Field Operator Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {userData?.email} - {userData?.company}
          </p>
        </div>

        {/* Quick Stats */}
        {productionData.length === 0 ? (
          <div className=" bg-yellow-100 p-3 my-6 w-max rounded-lg text-yellow-700 text-base mx-auto">
            Oops! you are yet to enter Today&#39;s Production Data for your
            Field
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard
              title="Today's Production"
              value={todaysTotal}
              color="blue"
              unit=" BBL"
            />
            <SummaryCard
              title="Entries Today"
              value={productionData.length}
              color="green"
            />
            <SummaryCard
              title="Average BSW"
              value={averageBSW.toFixed(2)}
              color="orange"
              unit="%"
            />
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              Enter Production Data
            </h3>
            <p className="text-gray-600 mb-4">
              Record your daily production measurements to ensure accurate
              allocation.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Add Production Entry
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">View Historical Data</h3>
            <p className="text-gray-600 mb-4">
              Review your past production entries and trends.
            </p>
            <button
              onClick={() => router.push("/production")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              View Production History
            </button>
          </div>
        </div>
        {/* Today's Entries */}
        {productionData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Today&rsquo;s Entries</h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner message="Loading today's data..." />
                </div>
              ) : productionData.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No production entries for today yet.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume (BBL)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BSW (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temperature (°F)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pressure (PSI)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productionData.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.gross_volume_bbl.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.bsw_percent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.temperature_degF}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.pressure_psi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          ""
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Production Entry"
      >
        <div className="space-y-4">
          {formFields.map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={formData[field.key]}
              onChange={handleInputChange}
            />
          ))}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {loading ? "Saving..." : "Save Entry"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
