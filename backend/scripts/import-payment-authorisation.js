/**
 * Importer for OPHELP "Payment Authorisation" (PA) slips — the
 * PA_<no>_<payee>_<caption>.xlsx forms used to authorise one-off or
 * recurring payments (direct debits, supplier invoices, etc.).
 *
 * Unlike the .mdb Paybook (which needs an external tool to read), these
 * are plain .xlsx files, so this script parses them directly with the
 * `xlsx` package — no conversion step needed.
 *
 * Usage:
 *   railway run node backend/scripts/import-payment-authorisation.js <path-to.xlsx>
 *   node backend/scripts/import-payment-authorisation.js backend/scripts/data/PA_01_001_HEALTH4ME_Payment_March_2026.xlsx
 *
 * The parser is label-driven (it looks for cells like "Amount:",
 * "Compiler:", "Caption:" and reads the next non-empty cell in that row)
 * rather than hard-coded to one row/column layout, so it tolerates the
 * usual small shifts between one PA slip and the next as long as the
 * labels stay the same.
 *
 * Idempotent: re-running with the same PA number updates that record
 * instead of duplicating it.
 */
import path from 'node:path'
import XLSX from 'xlsx'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node import-payment-authorisation.js <path-to.xlsx>')
  process.exit(1)
}

/** Build a { "A1": value, "B3": value, ... } style map plus a row/col grid. */
function readGrid(ws) {
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

/** First non-null, non-currency-symbol cell to the right of a label cell
 * in the same row (skips placeholder cells like "R", "C R", "E R" that
 * just mark where a currency figure belongs). */
function valueRightOf(grid, label) {
  const norm = (s) => String(s ?? '').trim().toLowerCase()
  const isCurrencyPlaceholder = (v) =>
    typeof v === 'string' && /^[a-z]?\s*r\s*$/i.test(v.trim())
  for (const row of grid) {
    const idx = row.findIndex((v) => norm(v) === norm(label))
    if (idx === -1) continue
    for (let c = idx + 1; c < row.length; c++) {
      const v = row[c]
      if (v !== null && v !== undefined && v !== '' && !isCurrencyPlaceholder(v)) return v
    }
  }
  return null
}

/** For the fixed "INVOICE" breakdown block (Pay/Transport/Material/Admin/
 * Other/Fee rows): the label lives in column B and the figure in column H,
 * so look it up by row rather than by nearest non-empty cell — the columns
 * in between are just currency-symbol placeholders. */
function invoiceLineValue(grid, label) {
  const norm = (s) => String(s ?? '').trim().toLowerCase()
  for (const row of grid) {
    if (norm(row[1]) === norm(label)) return row[7] ?? null
  }
  return null
}

function toIsoDate(v) {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

function toNumber(v, fallback = 0) {
  if (v === null || v === undefined || v === '' || v === 'nil') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function parsePaSlip(grid, sourceFile) {
  const paNumber = String(valueRightOf(grid, 'PA') ?? '').trim()
  return {
    paNumber,
    date: toIsoDate(valueRightOf(grid, 'Date:')),
    compiler: valueRightOf(grid, 'Compiler:') || '',
    payee: valueRightOf(grid, 'To:') || '',
    bank: {
      bank: valueRightOf(grid, 'Bank:') || '',
      branchCode: valueRightOf(grid, 'Branch Code:') || '',
      accountType: valueRightOf(grid, 'Account type:') || '',
      accountNo: valueRightOf(grid, 'Account No:') || '',
    },
    amount: toNumber(valueRightOf(grid, 'Amount:')),
    details: valueRightOf(grid, 'Details:') || '',
    authorisation: valueRightOf(grid, 'Authorisation:') || '',
    capturedBy: valueRightOf(grid, 'By:') || '',
    expenseAccount: valueRightOf(grid, 'Account:') || '',
    expenseColumn: valueRightOf(grid, 'Column:') || '',
    caption: valueRightOf(grid, 'Caption:') || '',
    client: valueRightOf(grid, 'CLIENT:') || '',
    invoice: {
      pay: toNumber(invoiceLineValue(grid, 'Pay')),
      transport: toNumber(invoiceLineValue(grid, 'Transport')),
      material: toNumber(invoiceLineValue(grid, 'Material')),
      admin: toNumber(invoiceLineValue(grid, 'Admin')),
      other: toNumber(invoiceLineValue(grid, 'Other')),
      fee: toNumber(invoiceLineValue(grid, 'Fee')),
    },
    sourceFile,
  }
}

async function importPaSlip() {
  console.log(`[import-pa] Reading ${filePath} ...`)
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const grid = readGrid(ws)
  const parsed = parsePaSlip(grid, path.basename(filePath))

  if (!parsed.paNumber) throw new Error('Could not find a PA number (cell to the right of "PA") in this file')

  console.log(`[import-pa] PA ${parsed.paNumber} — ${parsed.payee} — R${parsed.amount} (${parsed.caption})`)

  const existing = await listEntity('payment_authorisations')
  const match = existing.find((p) => p.paNumber === parsed.paNumber)
  const id = match?.id ?? uid()

  await insertEntity('payment_authorisations', {
    id,
    ...parsed,
    status: match?.status ?? 'captured',
    createdAt: match?.createdAt ?? now(),
    importedAt: now(),
  })

  console.log(`[import-pa] Saved as ${match ? 'update to' : 'new'} record ${id}.`)
  await pool.end()
  console.log('[import-pa] Done.')
}

importPaSlip().catch((err) => {
  console.error('[import-pa] Failed:', err)
  process.exit(1)
})
