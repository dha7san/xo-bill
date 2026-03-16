/**
 * Centralized config — all values sourced from environment variables.
 * Import this instead of using import.meta.env directly.
 */

export const CONFIG = {
  storeName:      import.meta.env.VITE_STORE_NAME    ?? 'XoPOS',
  storeTagline:   import.meta.env.VITE_STORE_TAGLINE ?? 'Point of Sale',
  upiId:          import.meta.env.VITE_UPI_ID        ?? 'yourshop@upi',
  apiBaseUrl:     import.meta.env.VITE_API_BASE_URL  ?? 'http://localhost:5000/api',
  gstRate:        Number(import.meta.env.VITE_GST_RATE ?? '0.05'),

  // SHA-256 hashes of PINs — never store raw PINs in env or code
  cashierPinHash: import.meta.env.VITE_CASHIER_PIN_HASH ?? '',
  managerPinHash: import.meta.env.VITE_MANAGER_PIN_HASH ?? '',
};

/**
 * Hash a string using the Web Crypto API (SHA-256).
 * Returns a lowercase hex string.
 */
export async function sha256(text) {
  const msgBuffer  = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a plain-text PIN against the stored SHA-256 hash.
 */
export async function verifyPin(plain, storedHash) {
  if (!storedHash) return false;
  const hash = await sha256(plain);
  return hash === storedHash;
}

/** Session key names */
export const SESSION_KEYS = {
  cashierUnlocked: 'pos_cashier_unlocked',
  managerUnlocked: 'pos_manager_unlocked',
};
