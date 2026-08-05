const UK_MOBILE_REGEX = /^(?:\+44|0044|0)7\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact({ name, email, phone }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.';
  const cleanedPhone = (phone || '').replace(/[\s()-]/g, '');
  if (!UK_MOBILE_REGEX.test(cleanedPhone)) errors.phone = 'Please enter a valid UK mobile number (e.g. 07123 456789).';
  return errors;
}
