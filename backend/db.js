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

// SSL: off by default. Railway's private network (both the official
// Postgres plugin and a plain postgres:latest image, which don't run a
// TLS listener internally) rejects SSL handshakes outright, so guessing
// "railway in the hostname => use SSL" is wrong. Managed external
// providers that *do* require SSL (Neon, Supabase, RDS, etc.) are opted
// into explicitly with PGSSLMODE=require.
const ssl = process.env.PGSSLMODE === 'require'
  ? { rejectUnauthorized: false }
  : false

export const pool = new Pool({ connectionString, ssl })

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err)
})

export async function query(text, params) {
  return pool.query(text, params)
}
