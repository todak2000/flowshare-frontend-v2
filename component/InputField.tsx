import { LucideProps } from "lucide-react";
import { COLORS } from "./Home";

export interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  disabled?: boolean;
  error?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled = false,
  error = false,
}) => (
  <div className="space-y-2">
    <label className={`block text-sm font-medium ${COLORS.text.primary}`}>
      {label}
    </label>
    <div className="relative">
      <div
        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-10 py-3
          ${COLORS.background.glass} backdrop-blur-sm
          ${error ? "border-red-500/50" : COLORS.border.light}
          border rounded-xl
          ${COLORS.text.primary}
          placeholder-gray-500
          focus:outline-none focus:ring-2 focus:${
            COLORS.border.ring
          } focus:border-transparent
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
    </div>
  </div>
);
