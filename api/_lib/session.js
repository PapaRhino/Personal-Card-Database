import crypto from 'crypto'

const SECRET = process.env.SESSION_SECRET
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export function createSessionToken(profileId) {
  const expires = Date.now() + SESSION_TTL_MS
  const payload = `${profileId}.${expires}`
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySessionToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [profileId, expires, sig] = parts
  const payload = `${profileId}.${expires}`
  const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  const validSig = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  if (!validSig) return null
  if (Date.now() > Number(expires)) return null
  return { profileId }
}

export function sessionCookie(token) {
  const isProd = process.env.VERCEL_ENV === 'production'
  return `tcg_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Lax${isProd ? '; Secure' : ''}`
}
