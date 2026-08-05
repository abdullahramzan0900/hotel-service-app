// UK phone number validation
// Accepts: 07123456789, 07123 456789, +447123456789, +44 7123 456789, 00447123456789
const UK_MOBILE_REGEX = /^(?:\+44|0044|0)7\d{9}$/;

export function isValidUKPhone(rawPhone) {
  if (!rawPhone) return false;
  const cleaned = rawPhone.replace(/[\s()-]/g, '');
  return UK_MOBILE_REGEX.test(cleaned);
}

export function normalizeUKPhone(rawPhone) {
  const cleaned = rawPhone.replace(/[\s()-]/g, '');
  if (cleaned.startsWith('+44')) return '0' + cleaned.slice(3);
  if (cleaned.startsWith('0044')) return '0' + cleaned.slice(4);
  return cleaned;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 60;
}

// Validates the guest contact block { name, email, phone } shared across every submission
export function validateGuestContact({ name, email, phone }) {
  const errors = {};
  if (!isValidName(name)) errors.name = 'Please enter your full name (2-60 characters).';
  if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!isValidUKPhone(phone)) errors.phone = 'Please enter a valid UK mobile number (e.g. 07123 456789).';
  return { valid: Object.keys(errors).length === 0, errors };
}
