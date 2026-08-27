/**
 * Importer for OPHELP's weekly "register" workbooks — Operations Office
 * Register, Coaching Leadership Register, Leave Register, Payroll Register
 * (cover sheet), etc. These share one family of layout even though the
 * exact columns shift a little from sheet to sheet:
 *
 *   - a header row with "Client No" / "Function" and a run of day columns
 *     (weekday names or dates) ending in a "TOTAL" column
 *   - either:
 *       (a) one row per person, each followed by an "Hours" row and a
 *           "Rate" row (the day's pay) — OPS Office / Coaching / Leave
 *           Register style, or
 *       (b) one flat row per category with the day figures directly in
 *           it — the Payroll Register cover-sheet style
 *   - a "TOTALS" row
 *   - an "OASys Details" section mapping the register to OASys invoicing
 *     accounts (Client No / OASys Account / Pay / Extra / Sub-Total /
 *     Admin Fee / Invoice Value)
 *
 * The parser is column-position-driven off the header row (finds the day
 * columns and the TOTAL column by content, not by fixed index) so it
 * tolerates the layout drifting by a column or two between sheets, which
 * happens here (OPS Office has no "Hrs Quota" column, Coaching and Leave
 * Register do).
 *
 * Usage:
 *   railway run node backend/scripts/import-weekly-register.js <path.xlsx> [sheetName]
 *   node backend/scripts/import-weekly-register.js backend/scripts/data/Coaching_Leadership_and_Coaching_Administration_1.xlsx
 *
 * With no sheet name, every sheet in the workbook is imported as its own
 * register. Idempotent per (source file, sheet name) — re-running updates
 * that register instead of duplicating it.
 */
import path from 'node:path'
import XLSX from 'xlsx'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2]
const onlySheet = process.argv[3]

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function norm(v) { return String(v ?? '').trim().toLowerCase() }
function isDayLike(v) {
  if (v instanceof Date) return true
  return typeof v === 'string' && DAY_NAMES.includes(norm(v))
}
function toNumOrNull(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function toNumber(v, fallback = 0) {
  const n = toNumOrNull(v)
  return n === null ? fallback : n
}
function dayLabel(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v ?? '').trim()
}
function sum(arr) { return arr.reduce((s, v) => s + (v ?? 0), 0) }

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

/** Cell to the right of a label cell in the same row (first non-empty). */
function valueRightOf(grid, label, { upTo } = {}) {
  const rows = upTo ? grid.slice(0, upTo) : grid
  for (const row of rows) {
    const idx = row.findIndex((v) => norm(v) === norm(label))
    if (idx === -1) continue
    for (let c = idx + 1; c < row.length; c++) {
      if (row[c] !== null && row[c] !== undefined && row[c] !== '') return row[c]
    }
  }
  return null
}

/** A label may share a cell with its value, e.g. "From:   12 August 2026".
 * Falls back to splitting on the label text if valueRightOf finds nothing. */
function inlineOrRightValue(grid, label, headerLimit) {
  const right = valueRightOf(grid, label, { upTo: headerLimit })
  if (right !== null) return right
  for (const row of grid.slice(0, headerLimit)) {
    for (const cell of row) {
      if (typeof cell === 'string' && norm(cell).startsWith(norm(label))) {
        return cell.slice(cell.toLowerCase().indexOf(label.toLowerCase()) + label.length).trim()
      }
    }
  }
  return null
}

/** Collapse a set of column indices to just its longest run of
 * consecutive columns — filters out stray day-like cells sitting
 * elsewhere on the sheet (e.g. a leftover data-validation list). */
function longestConsecutiveRun(indices) {
  let best = []
  let current = []
  for (let i = 0; i < indices.length; i++) {
    if (i === 0 || indices[i] - indices[i - 1] === 1) current.push(indices[i])
    else { if (current.length > best.length) best = current; current = [indices[i]] }
  }
  if (current.length > best.length) best = current
  return best
}

function findHeaderRow(grid) {
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]
    const hasTotal = row.some((v) => norm(v) === 'total')
    const dayLikeCount = row.filter(isDayLike).length
    if (hasTotal && dayLikeCount >= 3) return r
  }
  return -1
}

export function parseSheet(ws, sheetName, sourceFile) {
  const grid = readGrid(ws)
  const headerRow = findHeaderRow(grid)
  if (headerRow === -1) return null // not a register-shaped sheet — skip

  const header = grid[headerRow]
  const dayCols = longestConsecutiveRun(header.map((v, i) => (isDayLike(v) ? i : -1)).filter((i) => i !== -1))
  const totalCol = header.findIndex((v) => norm(v) === 'total')
  const days = dayCols.map((c) => dayLabel(header[c]))

  // Metadata lives above the header row.
  const metaLimit = headerRow
  let periodFrom = inlineOrRightValue(grid, 'From:', metaLimit)
  let periodTo = inlineOrRightValue(grid, 'To:', metaLimit)
  let payrollNo = inlineOrRightValue(grid, 'Payroll No:', metaLimit)
  const preparedBy = inlineOrRightValue(grid, 'Prepared by:', metaLimit)
  const checkedBy = inlineOrRightValue(grid, 'Checked by:', metaLimit)
  const signedOffBy = inlineOrRightValue(grid, 'Signed off:', metaLimit)
  const title = (grid[0] || []).find((v) => typeof v === 'string' && v.trim()) || sheetName

  // Some sheets (e.g. the Payroll Register cover sheet) use "PERIOD:" with
  // a single "<from> - <to>" value instead of separate "From:"/"To:" cells,
  // and "PAYROLL REGISTER No" instead of "Payroll No:".
  if (!periodFrom && !periodTo) {
    const period = inlineOrRightValue(grid, 'PERIOD:', metaLimit)
    if (period && typeof period === 'string' && period.includes(' - ')) {
      const [from, to] = period.split(' - ').map((s) => s.trim())
      periodFrom = from
      periodTo = to
    }
  }
  if (!payrollNo) payrollNo = inlineOrRightValue(grid, 'PAYROLL REGISTER No', metaLimit)

  // ── Lines ──
  const lines = []
  let pending = null
  let r = headerRow + 1
  let oasysHeaderRow = -1

  for (; r < grid.length; r++) {
    const row = grid[r]
    const rowNorm = row.map(norm)
    if (rowNorm.some((v) => v.includes('oasys'))) { oasysHeaderRow = r; break }
    if (rowNorm[0] === 'totals' || rowNorm[0] === 'total') continue // per-block subtotal row, not the OASys marker
    if (rowNorm.includes('hours')) {
      if (pending) pending.hoursByDay = dayCols.map((c) => toNumOrNull(row[c]))
      continue
    }
    if (rowNorm.includes('rate')) {
      if (pending) {
        pending.amountByDay = dayCols.map((c) => toNumOrNull(row[c]))
        pending.total = totalCol !== -1 ? toNumber(row[totalCol], sum(pending.amountByDay)) : sum(pending.amountByDay)
        lines.push(pending)
        pending = null
      }
      continue
    }
    const label = row[1]
    if (label && String(label).trim()) {
      const dayVals = dayCols.map((c) => toNumOrNull(row[c]))
      const hasDayVals = dayVals.some((v) => v !== null)
      if (hasDayVals) {
        // Flat category row — the whole line is here, no Hours/Rate rows follow.
        lines.push({
          clientNo: row[0] != null ? String(row[0]) : undefined,
          label: String(label).trim(),
          hoursByDay: dayCols.map(() => null),
          amountByDay: dayVals,
          total: totalCol !== -1 && row[totalCol] != null ? toNumber(row[totalCol]) : sum(dayVals),
        })
      } else {
        pending = {
          clientNo: row[0] != null ? String(row[0]) : undefined,
          label: String(label).trim(),
          hoursByDay: dayCols.map(() => null),
          amountByDay: dayCols.map(() => null),
          total: 0,
        }
      }
    }
  }

  // ── OASys Details ──
  const oasys = []
  let totalInvoiceValue = 0
  if (oasysHeaderRow !== -1) {
    let colRow = -1
    for (let i = oasysHeaderRow; i < grid.length; i++) {
      const rn = grid[i].map(norm)
      if (rn.includes('pay') && rn.includes('extra')) { colRow = i; break }
    }
    if (colRow !== -1) {
      const cols = grid[colRow]
      const payCol = cols.findIndex((v) => norm(v) === 'pay')
      const extraCol = cols.findIndex((v) => norm(v) === 'extra')
      const subTotalCol = cols.findIndex((v) => norm(v).replace(/\s|-/g, '') === 'subtotal')
      const adminFeeCol = cols.findIndex((v) => norm(v).includes('admin fee'))
      const invoiceCol = cols.findIndex((v) => norm(v).includes('invoice value'))

      for (let i = colRow + 1; i < grid.length; i++) {
        const row = grid[i]
        if (norm(row[0]) === 'totals') break
        const account = row[1]
        if (!account || !String(account).trim()) continue
        oasys.push({
          clientNo: row[0] != null ? String(row[0]) : undefined,
          account: String(account).trim(),
          pay: toNumber(row[payCol]),
          extra: toNumber(row[extraCol]),
          subTotal: toNumber(row[subTotalCol]),
          adminFeePct: adminFeeCol !== -1 ? toNumOrNull(row[adminFeeCol]) ?? undefined : undefined,
          invoiceValue: invoiceCol !== -1 ? toNumber(row[invoiceCol]) : 0,
        })
      }
      totalInvoiceValue = sum(oasys.map((o) => o.invoiceValue))
    }
  }
  if (!totalInvoiceValue) totalInvoiceValue = sum(lines.map((l) => l.total))

  const sheetKey = norm(sheetName) + ' ' + norm(title)
  const type =
    sheetKey.includes('ops office') || sheetKey.includes('operations office') ? 'ops_office' :
    sheetKey.includes('coaching') ? 'coaching_leadership' :
    sheetKey.includes('leave') ? 'leave_register' :
    sheetKey.includes('payroll register') ? 'payroll_register' :
    'other'

  return {
    type,
    title: String(title).trim(),
    periodFrom: periodFrom ? String(periodFrom).trim() : '',
    periodTo: periodTo ? String(periodTo).trim() : '',
    payrollNo: payrollNo ? String(payrollNo).trim() : '',
    preparedBy: preparedBy ? String(preparedBy).trim() : undefined,
    checkedBy: checkedBy ? String(checkedBy).trim() : undefined,
    signedOffBy: signedOffBy ? String(signedOffBy).trim() : undefined,
    days,
    lines,
    oasys,
    totalInvoiceValue,
    sourceFile,
    sourceSheet: sheetName,
  }
}

async function importWorkbook() {
  if (!filePath) {
    console.error('Usage: node import-weekly-register.js <path-to.xlsx> [sheetName]')
    process.exit(1)
  }
  console.log(`[import-register] Reading ${filePath} ...`)
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const sourceFile = path.basename(filePath)
  const sheetNames = onlySheet ? [onlySheet] : wb.SheetNames

  const existing = await listEntity('weekly_registers')

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) { console.warn(`[import-register] Sheet "${sheetName}" not found — skipping.`); continue }
    const parsed = parseSheet(ws, sheetName, sourceFile)
    if (!parsed) { console.log(`[import-register] "${sheetName}" doesn't look like a register sheet — skipping.`); continue }

    const match = existing.find((r) => r.sourceFile === sourceFile && r.sourceSheet === sheetName)
    const id = match?.id ?? uid()
    await insertEntity('weekly_registers', {
      id,
      ...parsed,
      createdAt: match?.createdAt ?? now(),
      importedAt: now(),
    })
    console.log(
      `[import-register] "${sheetName}" -> ${parsed.type} — ${parsed.lines.length} line(s), ` +
      `${parsed.oasys.length} OASys line(s), invoice value R${parsed.totalInvoiceValue.toFixed(2)} ` +
      `(${match ? 'updated' : 'new'} record ${id})`
    )
  }

  await pool.end()
  console.log('[import-register] Done.')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  importWorkbook().catch((err) => {
    console.error('[import-register] Failed:', err)
    process.exit(1)
  })
}
