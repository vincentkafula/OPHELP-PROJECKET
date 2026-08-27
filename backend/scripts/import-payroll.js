/**
 * One-off / repeatable importer for a Straatwerk-style Paybook export
 * (Access .mdb payroll run) into the Payroll module.
 *
 * The .mdb itself can't be read by Node directly, so the workflow is:
 *   1. On a machine with `mdbtools` installed, export each table to CSV
 *      and join them into the flat JSON shape this script expects (see
 *      backend/scripts/data/paybook-071.json for the reference shape —
 *      that file was produced this way from
 *      "Paybook_071_25_February_-_03_March_2026.mdb").
 *   2. Run this script against that JSON:
 *        railway run node backend/scripts/import-payroll.js backend/scripts/data/paybook-071.json
 *      (or `node backend/scripts/import-payroll.js <path>` locally, with
 *      DATABASE_URL pointed at the target database).
 *
 * Expected JSON shape:
 * {
 *   "period":      { "number": 71, "label": "25 Feb - 03 Mar 2026" },
 *   "roster":      [{ "fileNo", "name", "absaBeneficiaryNumber", "payrollCode" }],
 *   "entries":     [{ "name", "fileNo", "day", "task", "hours", "amount" }],
 *   "corrections": [{ "name", "fileNo", "detail", "amount", "journalEntry" }]
 * }
 *
 * Idempotent: re-running with the same period number updates the existing
 * period/roster/entries/corrections instead of duplicating them.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2] || path.join(import.meta.dirname, 'data', 'paybook-071.json')

function splitRosterName(name) {
  // Roster names come as "Surname, First Middle" — participants are
  // stored as separate firstName/lastName fields.
  const [last, first] = name.split(',').map((s) => (s || '').trim())
  return { firstName: first || '', lastName: last || name.trim() }
}

function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

async function findMatchingParticipant(participants, rosterName) {
  const { firstName, lastName } = splitRosterName(rosterName)
  const target = normalize(`${firstName} ${lastName}`)
  return participants.find((p) => normalize(`${p.firstName} ${p.lastName}`) === target) ?? null
}

async function importPayroll() {
  console.log(`[import-payroll] Reading ${filePath} ...`)
  const raw = JSON.parse(readFileSync(filePath, 'utf8'))
  const { period, roster = [], entries = [], corrections = [] } = raw

  if (!period?.number) throw new Error('JSON is missing period.number')

  const participants = await listEntity('participants')
  const existingPeriods = await listEntity('payroll_periods')
  const existingByNumber = existingPeriods.find((p) => p.number === period.number)
  const periodId = existingByNumber?.id ?? `payroll-period-${period.number}`

  console.log(`[import-payroll] Period ${period.number} — "${period.label}" (id: ${periodId})`)

  await insertEntity('payroll_periods', {
    id: periodId,
    number: period.number,
    label: period.label,
    status: existingByNumber?.status ?? 'imported',
    importedAt: now(),
    createdAt: existingByNumber?.createdAt ?? now(),
  })

  // Roster — one record per file number, linked to a Participant if the
  // name matches an existing profile.
  const existingRoster = await listEntity('payroll_roster')
  const rosterIdByFileNo = new Map(existingRoster.map((r) => [r.fileNo, r.id]))
  let matched = 0

  for (const r of roster) {
    const participant = await findMatchingParticipant(participants, r.name)
    if (participant) matched++
    const id = rosterIdByFileNo.get(r.fileNo) ?? uid()
    await insertEntity('payroll_roster', {
      id,
      fileNo: r.fileNo,
      name: r.name,
      absaBeneficiaryNumber: r.absaBeneficiaryNumber || '',
      payrollCode: r.payrollCode || '-',
      participantId: participant?.id ?? null,
      createdAt: now(),
    })
    rosterIdByFileNo.set(r.fileNo, id)
  }
  console.log(`[import-payroll] Roster: ${roster.length} people (${matched} matched to existing participants)`)

  // Wipe previous entries/corrections for this period so re-imports don't
  // duplicate rows, then insert fresh ones.
  await pool.query(
    `DELETE FROM store WHERE entity = 'payroll_entries' AND data ->> 'periodId' = $1`,
    [periodId]
  )
  await pool.query(
    `DELETE FROM store WHERE entity = 'payroll_corrections' AND data ->> 'periodId' = $1`,
    [periodId]
  )

  for (const e of entries) {
    await insertEntity('payroll_entries', {
      id: uid(),
      periodId,
      rosterId: rosterIdByFileNo.get(e.fileNo) ?? null,
      name: e.name,
      fileNo: e.fileNo,
      day: e.day,
      task: e.task,
      hours: e.hours,
      amount: e.amount,
      createdAt: now(),
    })
  }
  console.log(`[import-payroll] Entries: ${entries.length}`)

  for (const c of corrections) {
    await insertEntity('payroll_corrections', {
      id: uid(),
      periodId,
      rosterId: rosterIdByFileNo.get(c.fileNo) ?? null,
      name: c.name,
      fileNo: c.fileNo,
      detail: c.detail,
      amount: c.amount,
      journalEntry: c.journalEntry,
      createdAt: now(),
    })
  }
  console.log(`[import-payroll] Corrections: ${corrections.length}`)

  const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0)
  const totalGross = entries.reduce((s, e) => s + (e.amount || 0), 0)
  const totalCorrections = corrections.reduce((s, c) => s + (c.amount || 0), 0)
  console.log(
    `[import-payroll] Totals — hours: ${totalHours}, gross: R${totalGross.toFixed(2)}, ` +
    `corrections: R${totalCorrections.toFixed(2)}, net: R${(totalGross + totalCorrections).toFixed(2)}`
  )

  await pool.end()
  console.log('[import-payroll] Done.')
}

importPayroll().catch((err) => {
  console.error('[import-payroll] Failed:', err)
  process.exit(1)
})
