// src/lib/validate.js — Input validation for security-sensitive values

/**
 * Validate a tmux session name. Must be alphanumeric, hyphens, underscores, dots only.
 * Prevents command injection via shell metacharacters.
 */
export function isValidSessionName(name) {
  if (!name || typeof name !== 'string') return false;
  if (name.length > 64) return false;
  // Only allow safe characters: letters, digits, hyphen, underscore, dot
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

/**
 * Validate a hostname or IP address.
 */
export function isValidHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  if (hostname.length > 253) return false;
  // Allow FQDN, bare hostname, or IPv4
  return /^[a-zA-Z0-9._-]+$/.test(hostname) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
}

/**
 * Sanitize a string for safe use in shell commands.
 * Strips anything that isn't alphanumeric, hyphen, underscore, dot, slash, or tilde.
 */
export function sanitizeShellArg(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9._\-\/~]/g, '');
}
