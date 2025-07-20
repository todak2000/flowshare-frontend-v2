'use client'
import { firebaseService } from "../../../lib/firebase-service";
import { useEffect, useState } from "react";
import { Filters, ProductionEntry, TabType } from "../../../types";
import { useUser } from "../../../hook/useUser";
import { FormField, FormFieldConfig, ProductionFormData } from "../../../component/formField";
import { formatDateForInput } from "../../../utils/date";
import { permissionsList } from "../../../constants";
import Modal from "../../../component/Modal";
import SummaryCard from "../../../component/SummaryCard";
import { ActionButtons } from "../../../component/ActionButtons";
import DateFilters from "../../../component/DateFilters";
import TabNavigation from "../../../component/TabNavigation";
import PartnerPieChart from "../../../component/PartnerPieChart";
import ProductionChart from "../../../component/ProductionChart";
import ProductionTable from "../../../component/ProductionTable";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { downloadCSV } from "../../../utils/csvExport";
import { useProductionCalculations } from "../../../hook/useProductionCalculations";

const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];


  const DynamicForm: React.FC<{
    formData: ProductionEntry;
    handleSubmit: (d: ProductionFormData) => void;
  }> = ({ formData, handleSubmit }) => {
    const [localFormData, setLocalFormData] = useState<ProductionFormData>({
      temperature_degF: formData ? formData.temperature_degF.toString() : "",
      pressure_psi: formData ? formData.pressure_psi.toString() : "",
      bsw_percent: formData ? formData.bsw_percent.toString() : "",
      gross_volume_bbl: formData ? formData.gross_volume_bbl.toString() : "",
    });
    const [loading, setLoading] = useState<boolean>(false);

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

    const handleInputChange = (
      key: keyof ProductionFormData,
      value: string
    ): void => {
      setLocalFormData({ ...localFormData, [key]: value });
      //
    };

    const handleSubmitLocal = (): void => {
      setLoading(true);
      handleSubmit(localFormData);
    };

    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg ">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Production Data Form
        </h2>

        <div>
          {formFields.map((field: FormFieldConfig) => (
            <FormField
              key={field.id}
              field={field}
              value={localFormData[field.key]}
              onChange={handleInputChange}
            />
          ))}

          <button
            onClick={handleSubmitLocal}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 mt-4"
          >
            {loading ? "Submitting" : "Submit Data"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Current Values:
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            {formFields.map((field: FormFieldConfig) => (
              <div key={field.id}>
                <span className="font-medium">{field.label}:</span>{" "}
                {localFormData[field.key] || "Not set"}{" "}
                {localFormData[field.key] && field.unit}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


const ProductionDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [productionData, setProductionData] = useState<ProductionEntry[]>([]);
  const [totalProductionData, setTotalProductionData] = useState<ProductionEntry[]>([]);
  const [filteredData, setFilteredData] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null);
  
  const { auth, data: userData, loading: userLoader } = useUser();

  // Initialize date filters to current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [filters, setFilters] = useState<Filters>({
    partner: "",
    startDate: formatDateForInput(firstDayOfMonth),
    endDate: formatDateForInput(lastDayOfMonth),
    search: "",
  });

  // Load data on component mount
  useEffect(() => {
    if (userData?.company) {
      loadProductionData();
    }
  }, [userData]);

  // Filter data when filters or data change
  useEffect(() => {
    applyFilters();
  }, [productionData, filters]);

  // Custom hook for calculations
  const calculations = useProductionCalculations(filteredData, totalProductionData);

  // Data loading and filtering functions
  const loadProductionData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [data, totalData] = await Promise.all([
        firebaseService.getProductionEntries(userData?.company as string),
        firebaseService.getProductionEntries()
      ]);
      
      setProductionData(data);
      setTotalProductionData(totalData);
    } catch (error) {
      console.error("Error loading production data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (): void => {
    let filtered = [...productionData];

    // Apply date filters
    if (filters.startDate) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) <= new Date(filters.endDate)
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        return Object.values(item).some(value => 
          value.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredData(filtered);
  };

  // Form handling
  const handleSubmit = async (data: ProductionFormData): Promise<void> => {
    if (!userData?.permissions.includes(permissionsList.canCreateProd)) {
      alert("You are not authorized to perform this operation");
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        partner: userData.company,
        gross_volume_bbl: parseFloat(data.gross_volume_bbl),
        bsw_percent: parseFloat(data.bsw_percent),
        temperature_degF: parseFloat(data.temperature_degF),
        pressure_psi: parseFloat(data.pressure_psi),
        timestamp: new Date(),
        created_by: auth.uid,
      };

      if (editingEntry) {
        await firebaseService.updateProductionEntry(editingEntry.id, submissionData);
      } else {
        await firebaseService.createProductionEntry(submissionData);
      }

      handleCloseForm();
      await loadProductionData();
    } catch (error) {
      console.error("Error saving production entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: ProductionEntry): void => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await firebaseService.deleteProductionEntry(id);
        await loadProductionData();
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const handleCloseForm = (): void => {
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleDownloadReport = (): void => {
    downloadCSV(filteredData);
  };

  // Loading state
  if (userLoader) {
    return <LoadingSpinner fullScreen message="Loading user data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Production Data Management
          </h1>
          <p className="text-gray-600">
            Enter and view your company&rsquo;s production contributions
          </p>
        </div>

        {/* Main Content Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* Filters */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <DateFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Action Buttons */}
          <ActionButtons
            onAddEntry={() => setShowForm(true)}
            onDownloadReport={handleDownloadReport}
            entriesCount={{ filtered: filteredData.length, total: productionData.length }}
          />
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <SummaryCard
                title="Total Volume"
                value={calculations.totalVolume}
                color="blue"
                unit=" BBL"
              />
              <SummaryCard
                title="Avg BSW"
                value={calculations.averageBSW.toFixed(2)}
                color="green"
                unit="%"
              />
              <SummaryCard
                title="Avg Temperature"
                value={calculations.averageTemperature}
                color="orange"
                unit="°F"
              />
              <SummaryCard
                title="Total Entries"
                value={filteredData.length}
                color="purple"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductionChart
                data={calculations.chartData}
                title="Daily Production Volume"
              />
              <PartnerPieChart
                data={calculations.partnerData}
                title="Volume by Partner"
                colors={CHART_COLORS}
              />
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <ProductionTable
            data={filteredData}
            loading={loading}
            canEdit={userData?.permissions.includes(permissionsList.canEditProd) || false}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingEntry ? "Edit Production Entry" : "Add Production Entry"}
      >
        <DynamicForm
           formData={editingEntry as ProductionEntry}
           handleSubmit={handleSubmit}         />
      </Modal>
    </div>
  );
};

export default ProductionDashboard;
