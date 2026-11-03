import { createRemoteJWKSet, jwtVerify } from 'jose';

// Google's signing keys; jose caches them and refetches when Google rotates
const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

/**
 * Verifies a Google Sign-In ID token: signature, issuer, expiry and that it was issued to one of
 * our OAuth clients (GOOGLE_CLIENT_IDS: web, Android, iOS). Only verified emails are accepted.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  clientIds: string[]
): Promise<{ sub: string; email: string; name: string | null }> {
  if (clientIds.length === 0) throw new Error('GOOGLE_CLIENT_IDS is not set');
  const { payload } = await jwtVerify(idToken, GOOGLE_KEYS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientIds,
  });
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || payload.email_verified !== true) {
    throw new Error('Google account has no verified email');
  }
  return { sub: payload.sub, email: payload.email, name: typeof payload.name === 'string' ? payload.name : null };
}
