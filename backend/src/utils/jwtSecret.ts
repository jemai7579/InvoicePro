/**
 * Returns the JWT signing secret from the environment.
 * The startup validation in index.ts guarantees this is set before any
 * request reaches the app, so this function throws only as a safeguard
 * against improper out-of-order module initialization in tests.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Ensure the server started with valid environment variables.');
  }
  return secret;
}
