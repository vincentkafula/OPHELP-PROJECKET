import { pool } from './db.js'

export function uid() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  )
}

export function now() {
  return new Date().toISOString()
}

/** All rows for an entity, as plain JS objects. */
export async function listEntity(entity) {
  const { rows } = await pool.query(
    'SELECT data FROM store WHERE entity = $1 ORDER BY created_at ASC',
    [entity]
  )
  return rows.map((r) => r.data)
}

/** A single row by id, or null. */
export async function getEntity(entity, id) {
  const { rows } = await pool.query(
    'SELECT data FROM store WHERE entity = $1 AND id = $2',
    [entity, id]
  )
  return rows[0]?.data ?? null
}

/** First row matching a predicate over the JS object (filtered in-process). */
export async function findOneEntity(entity, predicate) {
  const all = await listEntity(entity)
  return all.find(predicate) ?? null
}

export async function whereEntity(entity, predicate) {
  const all = await listEntity(entity)
  return all.filter(predicate)
}

/** Insert a full document. `data.id` is required and used as the row id. */
export async function insertEntity(entity, data) {
  if (!data.id) throw new Error('insertEntity requires data.id')
  const { rows } = await pool.query(
    `INSERT INTO store (entity, id, data)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (entity, id) DO UPDATE SET data = EXCLUDED.data
     RETURNING data`,
    [entity, data.id, JSON.stringify(data)]
  )
  return rows[0].data
}

/** Shallow-merge a patch into an existing document. Returns null if missing. */
export async function updateEntity(entity, id, patch) {
  const existing = await getEntity(entity, id)
  if (!existing) return null
  const merged = { ...existing, ...patch }
  const { rows } = await pool.query(
    `UPDATE store SET data = $3::jsonb WHERE entity = $1 AND id = $2 RETURNING data`,
    [entity, id, JSON.stringify(merged)]
  )
  return rows[0]?.data ?? null
}

export async function deleteEntity(entity, id) {
  const { rowCount } = await pool.query(
    'DELETE FROM store WHERE entity = $1 AND id = $2',
    [entity, id]
  )
  return rowCount > 0
}

export async function countEntity(entity, predicate) {
  const all = await listEntity(entity)
  return predicate ? all.filter(predicate).length : all.length
}

/** Fetch several entities in parallel — used by the bootstrap endpoint. */
export async function listMany(entities) {
  const results = await Promise.all(entities.map((e) => listEntity(e)))
  return Object.fromEntries(entities.map((e, i) => [e, results[i]]))
}
