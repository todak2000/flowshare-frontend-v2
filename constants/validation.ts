// Validation Rules - Single source of truth for validation constraints

// Production Entry Validation
export const VALIDATION_RULES = {
  BSW_MIN: 0,
  BSW_MAX: 10,
  TEMP_MIN: 60,
  TEMP_MAX: 150,
  API_GRAVITY_MIN: 15,
  API_GRAVITY_MAX: 45,
  VOLUME_MIN: 0,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must not exceed ${max}`,
  INVALID_NUMBER: (field: string) => `${field} must be a valid number`,
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_DATE: 'Please enter a valid date',
  PASSWORD_TOO_SHORT: (min: number) => `Password must be at least ${min} characters`,
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
} as const;

// Field-specific validation messages
export const VALIDATION_MESSAGES = {
  temperature: {
    required: 'Temperature is required',
    min: `Temperature must be at least ${VALIDATION_RULES.TEMP_MIN}°F`,
    max: `Temperature must not exceed ${VALIDATION_RULES.TEMP_MAX}°F`,
  },
  api_gravity: {
    required: 'API Gravity is required',
    min: `API Gravity must be at least ${VALIDATION_RULES.API_GRAVITY_MIN}`,
    max: `API Gravity must not exceed ${VALIDATION_RULES.API_GRAVITY_MAX}`,
  },
  bsw_percent: {
    required: 'BSW % is required',
    min: `BSW % must be at least ${VALIDATION_RULES.BSW_MIN}`,
    max: `BSW % must not exceed ${VALIDATION_RULES.BSW_MAX}`,
  },
  gross_volume_bbl: {
    required: 'Gross Volume is required',
    min: `Volume must be greater than ${VALIDATION_RULES.VOLUME_MIN}`,
  },
} as const;
