export interface ProductionFormData {
  temperature_degF: string;
  pressure_psi: string;
  bsw_percent: string;
  gross_volume_bbl: string;
}

export interface FormFieldConfig {
  id: string;
  key: keyof ProductionFormData;
  label: string;
  unit: string;
  placeholder: string;
}

export interface FormFieldProps {
  field: FormFieldConfig;
  value: string;
  onChange: (key: keyof ProductionFormData, value: string) => void;
}

export const FormField: React.FC<FormFieldProps> = ({ field, value, onChange }) => {
  return (
    <div className="mb-4">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {field.label}
      </label>
      <div className="relative">
        <input
          type="text"
          id={field.id}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
          required
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
          {field.unit}
        </span>
      </div>
    </div>
  );
};