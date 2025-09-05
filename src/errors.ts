export const VALIDATION_ERRORS = {
  UTXO_NOT_FOUND: 'UTXO_NOT_FOUND',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
  DOUBLE_SPENDING: 'DOUBLE_SPENDING',
  NEGATIVE_AMOUNT: 'NEGATIVE_AMOUNT',
  ZERO_AMOUNT: 'ZERO_AMOUNT',
  EMPTY_INPUTS: 'EMPTY_INPUTS',
  EMPTY_OUTPUTS: 'EMPTY_OUTPUTS'
} as const;

export type ValidationErrorCode = (typeof VALIDATION_ERRORS)[keyof typeof VALIDATION_ERRORS];

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function createValidationError(
  code: ValidationErrorCode,
  message: string,
  details?: Record<string, any>
): ValidationError {
  return { code, message, details };
}
