/**
 * Importer for OPHELP's daily depot schedule documents — Word docs named
 * like "Maintenance_Depot_Day_Schedule_24_Aug_26.docx" — into a
 * `depot_schedules` record.
 *
 * The document has two tables:
 *   1. Shift Title and Scheduled hours / AT / Booked Participants — each
 *      shift row's "Booked Participants" cell contains a small nested
 *      table with the shift's foreman (and Confirmed/Reported/SMS
 *      check-columns) followed by a plain paragraph per worker
 *      ("DW. <name>").
 *   2. Morning / Afternoon depot-office roster — role label + name,
 *      repeated for morning and afternoon (usually the same person both
 *      shifts, but not always — the parser keeps them separate).
 *
 * Word tables don't convert cleanly with a text-only reader (the nested
 * table would get flattened into the surrounding text), so this uses
 * `mammoth` to render the doc to HTML — preserving table structure,
 * including nested tables — and `cheerio` to walk that HTML.
 *
 * Usage:
 *   railway run node backend/scripts/import-depot-schedule.js <path.docx>
 *
 * Idempotent per (depot name, date) — re-running with an updated version
 * of the same day's schedule replaces that record.
 */
import path from 'node:path'
import mammoth from 'mammoth'
import * as cheerio from 'cheerio'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2]

function text(el, $) { return $(el).text().replace(/\s+/g, ' ').trim() }
/** Cheerio (via its default HTML parser) wraps bare <tr> children of a
 * <table> in an implicit <tbody>, so a plain `.children('tr')` finds
 * nothing — go through the tbody, with a direct fallback just in case. */
function rowsOf(table, $) {
  const viaBody = $(table).children('tbody').children('tr')
  return (viaBody.length ? viaBody : $(table).children('tr')).toArray()
}

export function parseHtml(html) {
  const $ = cheerio.load(html)
  const tables = $('body').children('table').toArray()
  if (tables.length < 1) return null

  // ── Table 1: shifts ──
  const shiftTable = tables[0]
  const shiftRows = rowsOf(shiftTable, $)
  const titleRow = text(shiftRows[0], $)
  const dateMatch = titleRow.match(/–\s*(.+)$/) // "MAINTENANCE DEPOT: Shifts Schedule – Monday, 24 August 2026"
  const depotMatch = titleRow.match(/^([A-Z ]+?):/)
  const dateLabel = dateMatch ? dateMatch[1].trim() : ''
  const depotName = depotMatch ? depotMatch[1].trim() : 'DEPOT'
  const isoDate = (() => {
    const cleaned = dateLabel.replace(/^[A-Za-z]+,\s*/, '') // drop weekday name
    const d = new Date(cleaned)
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  })()

  const shifts = []
  for (let i = 2; i < shiftRows.length; i++) { // row 0 = title, row 1 = column headers
    const tds = $(shiftRows[i]).children('td').toArray()
    if (tds.length < 3) continue
    const titleCell = tds[0]
    const atCell = tds[1]
    const participantsCell = tds[2]

    const titleParas = $(titleCell).children('p').toArray().map((p) => text(p, $)).filter(Boolean)
    if (!titleParas.length) continue
    const shiftTitle = titleParas[0]
    const hoursMatch = titleParas.slice(1).join(' ').match(/\(([^)]+)\)/)
    const hours = hoursMatch ? hoursMatch[1].trim() : ''
    const at = text(atCell, $)

    // Nested Foreman/Confirmed/Reported/SMS table, if present.
    const nested = $(participantsCell).find('table').first()
    let foreman, confirmed = false, reported = false, sms = false
    if (nested.length) {
      const nestedRows = rowsOf(nested, $)
      if (nestedRows.length > 1) {
        const dataCells = $(nestedRows[1]).children('td').toArray().map((c) => text(c, $))
        const rawForeman = dataCells[0] || ''
        foreman = rawForeman.replace(/^DF\.?\s*/i, '').trim() || undefined
        confirmed = !!(dataCells[1] && dataCells[1] !== '')
        reported = !!(dataCells[2] && dataCells[2] !== '')
        sms = !!(dataCells[3] && dataCells[3] !== '')
      }
    }

    // Worker names: direct <p> children of the cell that aren't inside the nested table.
    const workers = $(participantsCell).children('p').toArray()
      .map((p) => text(p, $))
      .filter(Boolean)
      .map((t) => t.replace(/^DW\.?\s*/i, '').trim())

    shifts.push({ title: shiftTitle, hours, at, foreman, workers, confirmed, reported, sms })
  }

  // ── Table 2: depot office roster ──
  const roster = []
  if (tables.length > 1) {
    const rosterRows = rowsOf(tables[1], $)
    for (let i = 2; i < rosterRows.length; i++) { // row 0 = title, row 1 = Morning/Afternoon headers
      const tds = $(rosterRows[i]).children('td').toArray()
      if (tds.length < 4) continue
      const role = text(tds[0], $)
      const morning = text(tds[1], $)
      const afternoonRole = text(tds[2], $)
      const afternoon = text(tds[3], $)
      if (!role && !morning && !afternoon) continue // spacer row
      roster.push({ role, morning: morning || undefined, afternoonRole: afternoonRole || undefined, afternoon: afternoon || undefined })
    }
  }

  return { depotName, date: isoDate, dateLabel, shifts, roster }
}

async function importDepotSchedule() {
  if (!filePath) {
    console.error('Usage: node import-depot-schedule.js <path-to.docx>')
    process.exit(1)
  }
  console.log(`[import-depot-schedule] Reading ${filePath} ...`)
  const { value: html, messages } = await mammoth.convertToHtml({ path: filePath })
  if (messages.length) console.log('[import-depot-schedule] mammoth notes:', messages.map((m) => m.message).join('; '))

  const parsed = parseHtml(html)
  if (!parsed) throw new Error('Could not find a schedule table in this document')
  if (!parsed.date) throw new Error(`Could not parse a date from the title row ("${parsed.dateLabel}")`)

  console.log(`[import-depot-schedule] ${parsed.depotName} — ${parsed.dateLabel} — ${parsed.shifts.length} shift(s), ${parsed.roster.length} roster line(s)`)

  const existing = await listEntity('depot_schedules')
  const match = existing.find((s) => s.depotName === parsed.depotName && s.date === parsed.date)
  const id = match?.id ?? uid()

  await insertEntity('depot_schedules', {
    id,
    ...parsed,
    sourceFile: path.basename(filePath),
    createdAt: match?.createdAt ?? now(),
    importedAt: now(),
  })

  console.log(`[import-depot-schedule] Saved as ${match ? 'update to' : 'new'} record ${id}.`)
  await pool.end()
  console.log('[import-depot-schedule] Done.')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  importDepotSchedule().catch((err) => {
    console.error('[import-depot-schedule] Failed:', err)
    process.exit(1)
  })
}
