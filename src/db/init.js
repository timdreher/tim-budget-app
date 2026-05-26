import { db } from './schema.js'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './seeds.js'

export async function initDb() {
  const seeded = await db.settings.get('seeded')
  if (seeded?.value) return

  await db.transaction('rw', db.categories, db.settings, async () => {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
    await db.settings.bulkAdd(DEFAULT_SETTINGS)
  })
}
