// Form Field Configurations - Single source of truth for form definitions
import { Calculator, Thermometer, Activity, Droplets, BarChart3, Gauge } from 'lucide-react';
import { FormField } from '../hook/useFormFields';

// Production Form Fields
export const PRODUCTION_FORM_FIELDS: FormField[] = [
  {
    id: "temperature",
    key: "temperature_degF",
    label: "Temperature",
    type: "number",
    placeholder: "Enter temperature (°F)",
    icon: Thermometer,
    min: 60,
    max: 150,
    step: 0.1,
    required: true,
    helpText: "Operating temperature in degrees Fahrenheit",
  },
  {
    id: "api_gravity",
    key: "api_gravity",
    label: "API Gravity",
    type: "number",
    placeholder: "Enter API gravity",
    icon: Calculator,
    min: 15,
    max: 45,
    step: 0.1,
    required: true,
    helpText: "API gravity measurement",
  },
  {
    id: "bsw",
    key: "bsw_percent",
    label: "BSW %",
    type: "number",
    placeholder: "Enter BSW percentage",
    icon: Droplets,
    min: 0,
    max: 10,
    step: 0.01,
    required: true,
    helpText: "Basic sediment and water percentage",
  },
  {
    id: "gross_volume",
    key: "gross_volume_bbl",
    label: "Gross Volume (BBL)",
    type: "number",
    placeholder: "Enter gross volume",
    icon: Activity,
    min: 0,
    step: 0.01,
    required: true,
    helpText: "Total gross volume in barrels",
  },
];

// Production form data type (must match the actual form data structure)
export type ProductionFormDataType = {
  temperature_degF: string;
  api_gravity: string;
  bsw_percent: string;
  gross_volume_bbl: string;
};

// Legacy production form field config (for backward compatibility)
export interface ProductionFormFieldConfig {
  id: string;
  key: keyof ProductionFormDataType;
  label: string;
  unit: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PRODUCTION_FORM_FIELD_CONFIGS: ProductionFormFieldConfig[] = [
  {
    id: "temperature",
    key: "temperature_degF",
    label: "Temperature",
    unit: "°F",
    placeholder: "Enter temperature in Fahrenheit",
    icon: Thermometer,
  },
  {
    id: "api_gravity",
    key: "api_gravity",
    label: "Crude API Gravity",
    unit: "°API",
    placeholder: "Enter gravity value in °API",
    icon: Gauge,
  },
  {
    id: "bsw",
    key: "bsw_percent",
    label: "Basic Sediment and Water",
    unit: "%",
    placeholder: "Enter BSW percentage",
    icon: Droplets,
  },
  {
    id: "production",
    key: "gross_volume_bbl",
    label: "Production Volume",
    unit: "BBL",
    placeholder: "Enter volume in barrels",
    icon: BarChart3,
  },
];

// Terminal Receipt Form Fields
export const TERMINAL_FORM_FIELDS: FormField[] = [
  {
    id: "initial_volume",
    key: "initial_volume_bbl",
    label: "Initial Volume (BBL)",
    type: "number",
    placeholder: "Enter initial volume",
    icon: BarChart3,
    min: 0,
    step: 0.01,
    required: true,
    helpText: "Initial volume in barrels",
  },
  {
    id: "final_volume",
    key: "final_volume_bbl",
    label: "Final Volume (BBL)",
    type: "number",
    placeholder: "Enter final volume",
    icon: BarChart3,
    min: 0,
    step: 0.01,
    required: true,
    helpText: "Final volume in barrels",
  },
  {
    id: "temperature",
    key: "temperature_degF",
    label: "Temperature (°F)",
    type: "number",
    placeholder: "Enter temperature",
    icon: Thermometer,
    min: 60,
    max: 150,
    step: 0.1,
    required: true,
    helpText: "Measurement temperature in Fahrenheit",
  },
];
