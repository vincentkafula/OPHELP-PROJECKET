/**
 * Importer for the "qryAccsysExport" payroll report — the department/GL-code
 * grouped export OPHELP pushes into their Accsys accounting system. Unlike
 * the raw Paybook (per-day paysheet lines), this report is one row per
 * payee already grouped under a department heading ("OPHELP Contracted
 * Staff: Weekly Payroll:", "CCID Road Maintenance Team ...", etc.) with
 * subtotal rows in between and a GRAND TOTAL / "Check" block at the end.
 *
 * What this script does with it:
 *   - creates/updates the matching Payroll Period (parsed from the title
 *     row, e.g. "Payroll 096 Pay-outs for 19 August - 25 August 2026")
 *   - updates each payroll_roster entry's `department` and `glCode` (this
 *     report is the only source that carries that grouping)
 *   - records any non-zero "Medical Aid" / "Training Fund/ Loan Repayment"
 *     figures as payroll_corrections for that period, same as the Paybook
 *     corrections sheet
 *
 * It deliberately does NOT create payroll_entries — this report has no
 * day/task detail, just per-person totals, so hours/gross pay stay sourced
 * from the Paybook importer.
 *
 * Usage:
 *   railway run node backend/scripts/import-accsys-export.js <path.xlsx> [sheetName]
 */
import path from 'node:path'
import XLSX from 'xlsx'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2]
const sheetArg = process.argv[3]

function norm(v) { return String(v ?? '').trim().toLowerCase() }
function toNum(v) { const n = Number(v); return Number.isFinite(n) ? n : 0 }

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

export function parseAccsysExport(grid) {
  const titleRow = (grid[0] || []).find((v) => typeof v === 'string' && v.trim()) || ''
  const numberMatch = titleRow.match(/Payroll\s+0*(\d+)/i)
  const labelMatch = titleRow.match(/for\s+(.+)$/i)
  const periodNumber = numberMatch ? Number(numberMatch[1]) : null
  const periodLabel = labelMatch ? labelMatch[1].trim() : titleRow.trim()

  const headerRowIdx = grid.findIndex((row) => row.some((v) => norm(v) === 'name'))
  if (headerRowIdx === -1) return { periodNumber, periodLabel, rows: [] }
  const header = grid[headerRowIdx]
  const col = (label) => header.findIndex((v) => norm(v) === norm(label))
  const idx = {
    name: col('Name'),
    fileNo: col('strFileNo'),
    medicalAid: col('Medical Aid'),
    trainingFund: col('Training Fund/ Loan Repayment'),
    absa: col('ABSA Beneficiary number'),
    payrollCode: col('Payroll Code'),
    department: col('Department'),
    glCode: col('GL Codes'),
  }

  const rows = []
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    const rowId = row[0]
    // Data rows are numbered (1, 2, 3, ...); section headers, subtotal, and
    // total rows are text in that column instead.
    if (typeof rowId !== 'number') continue
    const name = row[idx.name]
    const fileNo = row[idx.fileNo]
    if (!name || !fileNo) continue
    rows.push({
      name: String(name).trim(),
      fileNo: String(fileNo).trim(),
      medicalAid: toNum(row[idx.medicalAid]),
      trainingFund: toNum(row[idx.trainingFund]),
      absaBeneficiaryNumber: row[idx.absa] != null ? String(row[idx.absa]).trim() : '',
      payrollCode: row[idx.payrollCode] != null ? String(row[idx.payrollCode]).trim() : '-',
      department: row[idx.department] != null ? String(row[idx.department]).trim() : '',
      glCode: row[idx.glCode] != null ? String(row[idx.glCode]).trim() : '',
    })
  }
  return { periodNumber, periodLabel, rows }
}

async function importAccsysExport() {
  if (!filePath) {
    console.error('Usage: node import-accsys-export.js <path-to.xlsx> [sheetName]')
    process.exit(1)
  }
  console.log(`[import-accsys] Reading ${filePath} ...`)
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const sheetName = sheetArg || wb.SheetNames.find((n) => /accsys/i.test(n)) || wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const grid = readGrid(ws)
  const { periodNumber, periodLabel, rows } = parseAccsysExport(grid)

  if (!periodNumber) throw new Error('Could not find a "Payroll NNN" period number in the title row')
  console.log(`[import-accsys] Payroll ${periodNumber} — "${periodLabel}" — ${rows.length} payee row(s)`)

  const existingPeriods = await listEntity('payroll_periods')
  const existingPeriod = existingPeriods.find((p) => p.number === periodNumber)
  const periodId = existingPeriod?.id ?? `payroll-period-${periodNumber}`
  await insertEntity('payroll_periods', {
    id: periodId,
    number: periodNumber,
    label: periodLabel,
    status: existingPeriod?.status ?? 'imported',
    createdAt: existingPeriod?.createdAt ?? now(),
    importedAt: now(),
  })

  const roster = await listEntity('payroll_roster')
  const rosterByFileNo = new Map(roster.map((r) => [r.fileNo, r]))

  await pool.query(
    `DELETE FROM store WHERE entity = 'payroll_corrections' AND data ->> 'periodId' = $1 AND data ->> 'sourceFile' = $2`,
    [periodId, path.basename(filePath)]
  )

  let updated = 0
  let created = 0
  let correctionsAdded = 0

  for (const row of rows) {
    const existingEntry = rosterByFileNo.get(row.fileNo)
    const id = existingEntry?.id ?? uid()
    await insertEntity('payroll_roster', {
      id,
      fileNo: row.fileNo,
      name: row.name,
      absaBeneficiaryNumber: row.absaBeneficiaryNumber || existingEntry?.absaBeneficiaryNumber || '',
      payrollCode: row.payrollCode || existingEntry?.payrollCode || '-',
      department: row.department,
      glCode: row.glCode,
      participantId: existingEntry?.participantId ?? null,
      createdAt: existingEntry?.createdAt ?? now(),
    })
    existingEntry ? updated++ : created++
    rosterByFileNo.set(row.fileNo, { id, fileNo: row.fileNo })

    if (row.medicalAid) {
      await insertEntity('payroll_corrections', {
        id: uid(), periodId, rosterId: id, name: row.name, fileNo: row.fileNo,
        detail: 'Medical Aid', amount: row.medicalAid, journalEntry: '',
        sourceFile: path.basename(filePath), createdAt: now(),
      })
      correctionsAdded++
    }
    if (row.trainingFund) {
      await insertEntity('payroll_corrections', {
        id: uid(), periodId, rosterId: id, name: row.name, fileNo: row.fileNo,
        detail: 'Training Fund / Loan Repayment', amount: row.trainingFund, journalEntry: '',
        sourceFile: path.basename(filePath), createdAt: now(),
      })
      correctionsAdded++
    }
  }

  console.log(`[import-accsys] Roster: ${updated} updated, ${created} newly created (department + GL code set on all ${rows.length})`)
  console.log(`[import-accsys] Corrections added: ${correctionsAdded}`)

  await pool.end()
  console.log('[import-accsys] Done.')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  importAccsysExport().catch((err) => {
    console.error('[import-accsys] Failed:', err)
    process.exit(1)
  })
}
