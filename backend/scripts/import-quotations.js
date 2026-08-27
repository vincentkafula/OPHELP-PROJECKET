/**
 * Importer for OPHELP's "Quotation Check" workbooks — job cost estimates
 * used to quote partners/clients before work starts (Supervision, Labour,
 * Materials, Transport line items -> Subtotal -> Admin Fee + Management
 * Fee -> Quotation Total). Each sheet in the workbook is a separate
 * quotation; the sheet name becomes the quotation title.
 *
 * Usage:
 *   railway run node backend/scripts/import-quotations.js <path.xlsx> [sheetName]
 *
 * With no sheet name, every sheet that matches the template is imported
 * (blank/unrelated sheets are skipped automatically). Idempotent per
 * (source file, sheet name) — re-running updates that quotation instead
 * of duplicating it.
 */
import path from 'node:path'
import XLSX from 'xlsx'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2]
const onlySheet = process.argv[3]

function norm(v) { return String(v ?? '').trim().toLowerCase() }
function toNum(v) { const n = Number(v); return Number.isFinite(n) ? n : 0 }

function readGrid(ws) {
  if (!ws['!ref']) return []
  const range = XLSX.utils.decode_range(ws['!ref'])
  const grid = []
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      row.push(cell ? cell.v : null)
    }
    grid.push(row)
  }
  return grid
}

const FOOTER_LABELS = ['subtotal', '25% admin fee', 'management fee', 'quatation total', 'quotation total']

export function parseQuotationSheet(grid) {
  const headerRowIdx = grid.findIndex((row) => norm(row[0]).startsWith('item') && row.some((v) => norm(v) === 'amount'))
  if (headerRowIdx === -1) return null

  const lineItems = []
  let category = ''
  const footer = { subtotal: 0, adminFee: 0, managementFee: 0, total: 0 }

  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    const label = norm(row[0])
    if (FOOTER_LABELS.includes(label)) {
      const amount = toNum(row[4])
      if (label === 'subtotal') footer.subtotal = amount
      else if (label === '25% admin fee') footer.adminFee = amount
      else if (label === 'management fee') footer.managementFee = amount
      else footer.total = amount
      continue
    }
    if (row[0] && typeof row[0] === 'string' && row[0].trim()) category = row[0].trim()

    const description = row[1] != null ? String(row[1]).trim() : ''
    const unitCost = row[2] != null ? toNum(row[2]) : null
    const units = row[3] != null ? toNum(row[3]) : null
    const amount = toNum(row[4])
    if (amount > 0) {
      lineItems.push({ category: category || 'Other', description, unitCost, units, amount })
    }
  }

  if (!lineItems.length && !footer.total) return null // not a real quotation sheet

  return {
    lineItems,
    subtotal: footer.subtotal || lineItems.reduce((s, i) => s + i.amount, 0),
    adminFee: footer.adminFee,
    managementFee: footer.managementFee,
    total: footer.total,
  }
}

async function importWorkbook() {
  if (!filePath) {
    console.error('Usage: node import-quotations.js <path-to.xlsx> [sheetName]')
    process.exit(1)
  }
  console.log(`[import-quotations] Reading ${filePath} ...`)
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const sourceFile = path.basename(filePath)
  const sheetNames = onlySheet ? [onlySheet] : wb.SheetNames

  const existing = await listEntity('quotations')
  let imported = 0

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) { console.warn(`[import-quotations] Sheet "${sheetName}" not found — skipping.`); continue }
    const parsed = parseQuotationSheet(readGrid(ws))
    if (!parsed) { console.log(`[import-quotations] "${sheetName}": no quotation template found — skipping.`); continue }

    const match = existing.find((q) => q.sourceFile === sourceFile && q.sourceSheet === sheetName)
    const id = match?.id ?? uid()
    await insertEntity('quotations', {
      id,
      title: sheetName,
      client: match?.client ?? '',
      status: match?.status ?? 'draft',
      ...parsed,
      sourceFile,
      sourceSheet: sheetName,
      createdAt: match?.createdAt ?? now(),
      importedAt: now(),
    })
    imported++
    console.log(`[import-quotations] "${sheetName}": ${parsed.lineItems.length} line item(s), total R${parsed.total.toFixed(2)} (${match ? 'updated' : 'new'} record ${id})`)
  }

  console.log(`[import-quotations] ${imported} quotation(s) imported.`)
  await pool.end()
  console.log('[import-quotations] Done.')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  importWorkbook().catch((err) => {
    console.error('[import-quotations] Failed:', err)
    process.exit(1)
  })
}
