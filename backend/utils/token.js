import crypto from 'crypto';

// Generates a long, unguessable, permanent token for a room's QR code.
// This is NEVER regenerated for normal guest turnover - only if a room
// is physically decommissioned/renumbered would a new one ever be made.
export function generateSecureToken() {
  return crypto.randomBytes(24).toString('hex'); // 48 hex chars
}
