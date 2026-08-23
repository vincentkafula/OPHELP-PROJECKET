import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

// Railway injects DATABASE_URL automatically when a Postgres plugin is
// attached to the service. DATABASE_PUBLIC_URL is used as a fallback for
// local development against a Railway-hosted database.
const connectionString =
  process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL

if (!connectionString) {
  console.warn(
    '[db] No DATABASE_URL set. Add a PostgreSQL plugin on Railway or set DATABASE_URL locally.'
  )
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('railway')
    ? { rejectUnauthorized: false }
    : process.env.PGSSLMODE === 'disable'
      ? false
      : connectionString
        ? { rejectUnauthorized: false }
        : undefined,
})

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err)
})

export async function query(text, params) {
  return pool.query(text, params)
}
