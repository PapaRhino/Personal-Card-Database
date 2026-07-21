import { supabaseAdmin } from './_lib/supabaseAdmin.js'
import { verifySessionToken } from './_lib/session.js'

function getCookie(req, name) {
  const header = req.headers.cookie || ''
  const found = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '='))
  return found ? decodeURIComponent(found.split('=').slice(1).join('=')) : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = verifySessionToken(getCookie(req, 'tcg_session'))
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { items } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items to import' })
  }

  let { data: location } = await supabaseAdmin
    .from('locations')
    .select('id')
    .eq('name', 'Unsorted')
    .maybeSingle()

  if (!location) {
    const { data: newLocation, error: locationError } = await supabaseAdmin
      .from('locations')
      .insert({ name: 'Unsorted' })
      .select('id')
      .single()
    if (locationError) return res.status(500).json({ error: locationError.message })
    location = newLocation
  }

  let imported = 0
  const errors = []

  for (const item of items) {
    try {
      const { data: existingCard } = await supabaseAdmin
        .from('cards')
        .select('id')
        .eq('game', item.game)
        .eq('external_source', item.external_source)
        .eq('external_id', item.external_id)
        .maybeSingle()

      let cardId = existingCard?.id

      if (!cardId) {
        const { data: newCard, error: cardError } = await supabaseAdmin
          .from('cards')
          .insert({
            game: item.game,
            name: item.name,
            set_name: item.set_name,
            set_code: item.set_code,
            card_number: item.card_number,
            rarity: item.rarity,
            image_url: item.image_url,
            external_source: item.external_source,
            external_id: item.external_id,
            raw_data: item.raw_data,
          })
          .select('id')
          .single()
        if (cardError) throw cardError
        cardId = newCard.id
      }

      const quantity = Math.max(1, Number(item.quantity) || 1)
      const copies = Array.from({ length: quantity }, () => ({
        card_id: cardId,
        location_id: location.id,
        variant: item.variant || null,
        notes: item.notes || null,
      }))

      const { error: copyError } = await supabaseAdmin.from('copies').insert(copies)
      if (copyError) throw copyError

      imported += quantity
    } catch (err) {
      errors.push({ name: item.name, error: err.message })
    }
  }

  return res.status(200).json({ imported, errors })
}
