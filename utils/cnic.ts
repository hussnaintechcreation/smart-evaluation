/**
 * Formats a raw string into a CNIC format (e.g., "12345-1234567-1").
 * This function is designed to be used in an onChange event handler.
 * @param value The raw input string from the text field.
 * @returns A formatted CNIC string.
 */
export const formatCNIC = (value: string): string => {
  if (!value) return '';

  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.length <= 5) {
    return digitsOnly;
  }
  
  if (digitsOnly.length <= 12) {
    return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`;
  }

  return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 12)}-${digitsOnly.slice(12, 13)}`;
};

/**
 * Validates if a string matches the standard CNIC format.
 * @param cnic The CNIC string to validate.
 * @returns True if the format is valid, otherwise false.
 */
export const validateCNIC = (cnic: string): boolean => {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
};
