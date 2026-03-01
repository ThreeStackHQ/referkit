import { cookies } from 'next/headers'

/**
 * Returns the current server-side session user ID, or null if unauthenticated.
 * Replace with your actual auth implementation (e.g. next-auth auth()).
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Read the session token from cookies — swap with real auth when configured
  const cookieStore = cookies()
  const sessionToken =
    cookieStore.get('next-auth.session-token')?.value ??
    cookieStore.get('__Secure-next-auth.session-token')?.value

  // TODO: validate token against DB / next-auth session store
  // For now return null when no session exists
  if (!sessionToken) return null

  // Stub: in production, decode the session and return user.id
  return null
}
