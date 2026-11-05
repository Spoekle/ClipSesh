import { randomBytes } from 'crypto';

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/**
 * Generates a new 24-character hex id in the same format as a MongoDB ObjectId
 * (4-byte timestamp + 8 random bytes), so ids created after the Postgres migration
 * look and sort like the ones migrated from MongoDB.
 *
 * @example
 * newId(); // '6720f3a1c4e9b2d87a1f0e53'
 */
export function newId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  return timestamp + randomBytes(8).toString('hex');
}

/**
 * Whether `value` is a well-formed id (24 hex characters).
 *
 * @example
 * isValidId('6720f3a1c4e9b2d87a1f0e53'); // true
 * isValidId('not-an-id'); // false
 */
export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}
