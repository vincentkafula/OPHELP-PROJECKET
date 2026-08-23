import { Router } from 'express'
import {
  listEntity, getEntity, insertEntity, updateEntity, deleteEntity, uid,
} from '../store.js'
import { requireAuth } from '../middleware/auth.js'

/**
 * Builds a standard CRUD router for an entity that doesn't need bespoke
 * business logic:
 *   GET    /            -> list all
 *   GET    /:id         -> single
 *   POST   /            -> create (server assigns id if not supplied)
 *   PUT    /:id         -> patch/merge
 *   DELETE /:id         -> remove
 *
 * `extraFields` lets a caller inject fields (like createdAt) on create.
 */
export function makeCrudRouter(entity, { extraFields } = {}) {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (req, res) => {
    res.json({ success: true, data: await listEntity(entity) })
  })

  router.get('/:id', async (req, res) => {
    const item = await getEntity(entity, req.params.id)
    if (!item) return res.status(404).json({ success: false, error: `${entity} not found` })
    res.json({ success: true, data: item })
  })

  router.post('/', async (req, res) => {
    const id = req.body.id || uid()
    const data = { ...(extraFields?.(req.body) ?? {}), ...req.body, id }
    const saved = await insertEntity(entity, data)
    res.status(201).json({ success: true, data: saved })
  })

  router.put('/:id', async (req, res) => {
    const updated = await updateEntity(entity, req.params.id, req.body)
    if (!updated) return res.status(404).json({ success: false, error: `${entity} not found` })
    res.json({ success: true, data: updated })
  })

  router.delete('/:id', async (req, res) => {
    const ok = await deleteEntity(entity, req.params.id)
    if (!ok) return res.status(404).json({ success: false, error: `${entity} not found` })
    res.json({ success: true })
  })

  return router
}
