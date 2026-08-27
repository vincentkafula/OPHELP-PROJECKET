/**
 * Importer for OPHELP's "Checking OASys" workbook — a weekly reconciliation
 * log going back to late 2022, one sheet per month (occasionally spanning
 * several months), each holding a run of 7-day blocks. Every block has:
 *
 *   - a header row of 7 dates
 *   - a run of raw daily entries below it
 *   - a pair of summary rows near the bottom — historically labelled
 *     "OASys Value" / "Payroll Value", more recently just "Correct" — each
 *     with a running weekly total, followed immediately by
 *   - a difference row that should be all zeros if OASys and the field
 *     registers agree for that week
 *
 * Rather than try to model every individual entry (the row-by-row detail
 * is genuinely ad hoc and drifts in shape release to release), this
 * importer extracts the reconciliation itself: per week, the two totals
 * being compared and whether they balanced — which is the actual point of
 * the workbook and is far more reliably extractable across 3+ years of
 * sheets than the transaction-level rows are.
 *
 * Usage:
 *   railway run node backend/scripts/import-oasys-checks.js <path.xlsx> [sheetName]
 *
 * With no sheet name, every sheet that contains at least one recognisable
 * weekly block is imported (rough scratch sheets like "Sheet1"/"Sheet2"
 * are skipped automatically since they don't match the pattern).
 * Idempotent per (source file, sheet name, week start date).
 */
import path from 'node:path'
import XLSX from 'xlsx'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2]
const onlySheet = process.argv[3]

function toIsoDate(v) { return v instanceof Date ? v.toISOString().slice(0, 10) : null }
function isNum(v) { return typeof v === 'number' && Number.isFinite(v) }

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

const DAY_COLS = [0, 1, 2, 3, 4, 5, 6]

/** First numeric cell after the 7 day columns — the row's grand total. */
function grandTotal(row) {
  for (let c = 7; c < row.length; c++) if (isNum(row[c])) return row[c]
  return null
}
/** First text label anywhere in the row outside the 7 day columns. */
function rowLabel(row) {
  for (let c = 7; c < row.length; c++) if (typeof row[c] === 'string' && row[c].trim()) return row[c].trim()
  return null
}

export function findWeekBlocks(grid) {
  const blocks = []
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]
    const isHeader = DAY_COLS.every((c) => row[c] instanceof Date)
    if (!isHeader) continue
    const dates = DAY_COLS.map((c) => toIsoDate(row[c]))

    // Look ahead (bounded, so a malformed block can't run us off the sheet)
    // for the difference row: 7 numeric day-cells that are all ~0.
    let diffRowIdx = -1
    for (let r2 = r + 1; r2 < grid.length && r2 < r + 80; r2++) {
      const row2 = grid[r2]
      if (DAY_COLS.some((c) => row2[c] instanceof Date)) break // next block started; no diff row for this one
      const vals = DAY_COLS.map((c) => row2[c])
      const allNumericOrNull = vals.every((v) => v === null || isNum(v))
      const hasSome = vals.some((v) => v !== null)
      const allNearZero = vals.every((v) => v === null || Math.abs(v) < 0.01)
      if (allNumericOrNull && hasSome && allNearZero) { diffRowIdx = r2; break }
    }
    if (diffRowIdx === -1) continue

    // The two rows immediately above the diff row (closest first) are the
    // totals being compared.
    const checkRows = []
    for (let r2 = diffRowIdx - 1; r2 > r && checkRows.length < 2; r2--) {
      const row2 = grid[r2]
      const vals = DAY_COLS.map((c) => row2[c])
      const allNumericOrNull = vals.every((v) => v === null || isNum(v))
      const hasSome = vals.some((v) => v !== null)
      if (!allNumericOrNull || !hasSome) break
      checkRows.unshift({ values: vals, label: rowLabel(row2), total: grandTotal(row2) })
    }
    if (checkRows.length < 2) continue // not a complete reconciliation block — skip

    const [a, b] = checkRows
    const dailyChecks = dates.map((date, i) => ({
      date,
      a: a.values[i],
      b: b.values[i],
      difference: (a.values[i] ?? 0) - (b.values[i] ?? 0),
    }))
    const balanced = dailyChecks.every((d) => Math.abs(d.difference) < 0.01)

    blocks.push({
      weekStart: dates[0],
      weekEnd: dates[6],
      labelA: a.label || 'Total A',
      labelB: b.label || 'Total B',
      totalA: a.total ?? dailyChecks.reduce((s, d) => s + (d.a ?? 0), 0),
      totalB: b.total ?? dailyChecks.reduce((s, d) => s + (d.b ?? 0), 0),
      dailyChecks,
      balanced,
    })
  }
  return blocks
}

async function importWorkbook() {
  if (!filePath) {
    console.error('Usage: node import-oasys-checks.js <path-to.xlsx> [sheetName]')
    process.exit(1)
  }
  console.log(`[import-oasys-checks] Reading ${filePath} ...`)
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const sourceFile = path.basename(filePath)
  const sheetNames = onlySheet ? [onlySheet] : wb.SheetNames

  const existing = await listEntity('oasys_checks')
  let totalBlocks = 0
  let totalUnbalanced = 0

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) { console.warn(`[import-oasys-checks] Sheet "${sheetName}" not found — skipping.`); continue }
    const blocks = findWeekBlocks(readGrid(ws))
    if (!blocks.length) { console.log(`[import-oasys-checks] "${sheetName}": no recognisable weekly blocks — skipping.`); continue }

    for (const block of blocks) {
      const match = existing.find(
        (r) => r.sourceFile === sourceFile && r.sourceSheet === sheetName && r.weekStart === block.weekStart
      )
      const id = match?.id ?? uid()
      await insertEntity('oasys_checks', {
        id,
        ...block,
        sourceFile,
        sourceSheet: sheetName,
        createdAt: match?.createdAt ?? now(),
        importedAt: now(),
      })
      if (!block.balanced) totalUnbalanced++
    }
    totalBlocks += blocks.length
    console.log(`[import-oasys-checks] "${sheetName}": ${blocks.length} week(s), ${blocks.filter((b) => !b.balanced).length} unbalanced`)
  }

  console.log(`[import-oasys-checks] Total: ${totalBlocks} week(s) imported, ${totalUnbalanced} unbalanced.`)
  await pool.end()
  console.log('[import-oasys-checks] Done.')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  importWorkbook().catch((err) => {
    console.error('[import-oasys-checks] Failed:', err)
    process.exit(1)
  })
}
