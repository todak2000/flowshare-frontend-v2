'use client';

import React, { useState } from 'react';
import { Modal } from '../../../../component/Modal';
import { COLORS } from '../../../../component/Home';
import { PRODUCTION_FORM_FIELD_CONFIGS } from '../../../../constants/forms';
import { ProductionFormData } from '../../../../component/formField';
import { ProductionEntry, UserRole } from '../../../../types';

interface FormFieldProps {
  field: {
    id: string;
    key: keyof ProductionFormData;
    label: string;
    unit: string;
    placeholder: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  value: string;
  onChange: (key: keyof ProductionFormData, value: string) => void;
  disabled: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange,
  disabled,
}) => {
  const Icon = field.icon;

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className={`block text-sm font-medium ${COLORS.text.primary}`}
      >
        {field.label}
      </label>
      <div className="relative">
        <div
          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <input
          id={field.id}
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={`w-full px-10 py-3 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        <div
          className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none ${COLORS.text.muted} text-xs`}
        >
          {field.unit}
        </div>
      </div>
    </div>
  );
};

interface ProductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingEntry: ProductionEntry | null;
  onSubmit: (data: ProductionFormData) => Promise<void>;
  loading: boolean;
  role: UserRole;
}

/**
 * ProductionForm Component
 * Modal form for creating and editing production entries
 */
export const ProductionForm: React.FC<ProductionFormProps> = ({
  isOpen,
  onClose,
  editingEntry,
  onSubmit,
  loading,
  role,
}) => {
  const [localFormData, setLocalFormData] = useState<ProductionFormData>({
    temperature_degF: editingEntry ? editingEntry.temperature_degF.toString() : '',
    api_gravity: editingEntry ? editingEntry.api_gravity.toString() : '',
    bsw_percent: editingEntry ? editingEntry.bsw_percent.toString() : '',
    gross_volume_bbl: editingEntry ? editingEntry.gross_volume_bbl.toString() : '',
  });

  const handleInputChange = (
    key: keyof ProductionFormData,
    value: string
  ): void => {
    setLocalFormData({ ...localFormData, [key]: value });
  };

  const handleSubmitLocal = async (): Promise<void> => {
    await onSubmit(localFormData);
  };

  const isValid = Object.values(localFormData).every(
    (value) => value.trim() !== ''
  );

  const modalTitle =
    editingEntry && role !== 'jv_partner'
      ? 'Edit Production Entry'
      : editingEntry && role === 'jv_partner'
      ? 'Approve Production Data'
      : 'Add Production Entry';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRODUCTION_FORM_FIELD_CONFIGS.map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={localFormData[field.key]}
              onChange={handleInputChange}
              disabled={loading || role === 'jv_partner'}
            />
          ))}
        </div>

        {/* Preview */}
        <div
          className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}
        >
          <h4 className={`text-sm font-medium ${COLORS.text.primary} mb-3`}>
            Preview Values:
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {PRODUCTION_FORM_FIELD_CONFIGS.map((field) => (
              <div key={field.id} className="flex justify-between">
                <span className={COLORS.text.muted}>{field.label}:</span>
                <span className={COLORS.text.primary}>
                  {localFormData[field.key] || '-'} {field.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmitLocal}
            disabled={!isValid || loading}
            className={`flex-1 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading
              ? 'Saving...'
              : editingEntry
              ? role === 'jv_partner'
                ? 'Approve'
                : 'Update Entry'
              : 'Create Entry'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className={`flex-1 ${COLORS.background.glass} ${COLORS.text.primary} py-3 rounded-xl font-medium hover:${COLORS.background.glassHover} transition-colors ${COLORS.border.light} border`}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
