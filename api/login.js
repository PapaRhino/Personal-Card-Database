import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './_lib/supabaseAdmin.js'
import { createSessionToken, sessionCookie } from './_lib/session.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { pin } = req.body || {}
  if (!pin) {
    return res.status(400).json({ error: 'PIN required' })
  }

  const { data: pins, error } = await supabaseAdmin
    .from('pins')
    .select('profile_id, pin_hash')

  if (error) {
    return res.status(500).json({ error: 'Server error' })
  }

  const match = pins.find((row) => bcrypt.compareSync(pin, row.pin_hash))
  if (!match) {
    return res.status(401).json({ error: 'Invalid PIN' })
  }

  const token = createSessionToken(match.profile_id)
  res.setHeader('Set-Cookie', sessionCookie(token))
  return res.status(200).json({ success: true })
}
