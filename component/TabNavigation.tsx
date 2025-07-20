import React from "react";
import { BarChart3, Eye } from "lucide-react";
import { TabType } from "../types";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: BarChart3 },
    { id: "data" as TabType, label: "Data View", icon: Eye },
  ];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === id
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </div>
  );
};
export default TabNavigation;
