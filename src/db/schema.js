import Dexie from 'dexie'

export const db = new Dexie('BudgetApp')

db.version(1).stores({
  // Indexes: id (primary), date, type, category — amount/notes/photo not indexed (no need to query by them)
  transactions: '++id, date, type, category, created_at',
  categories:   'id, type, group, sort_order',
  settings:     'key',
})
