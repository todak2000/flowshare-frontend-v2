// components/Button.tsx
import React from "react";
import { Loader } from "lucide-react";

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  children,
  variant = "primary",
  loading = false,
  icon,
}) => {
  const baseClasses = "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white",
    secondary: "bg-slate-500 hover:bg-slate-600 disabled:bg-slate-400 text-white",
    danger: "bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {loading ? <Loader className="animate-spin" size={20} /> : icon}
      <span>{children}</span>
    </button>
  );
};