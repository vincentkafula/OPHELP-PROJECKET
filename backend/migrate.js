import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  console.log('[migrate] Applying schema.sql ...')
  await pool.query(sql)
  console.log('[migrate] Done.')
  await pool.end()
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err)
  process.exit(1)
})
