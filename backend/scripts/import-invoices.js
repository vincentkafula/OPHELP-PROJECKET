/**
 * Importer for OPHELP's "Copy Tax Invoice" register PDFs (the invoices
 * Straatwerk/OPHELP issues to partners/clients — CIDs, hotels, churches,
 * property managers, etc.).
 *
 * PDF text extraction with real column positions isn't something Node's
 * PDF libraries do well out of the box (unlike Python's pdfplumber, which
 * gives per-word x/y coordinates — essential here since the "To" and
 * "Deliver to" address blocks sit in two columns that collide in a plain
 * text dump whenever the client name is long). So, same pattern as the
 * Payroll (.mdb) importer: convert externally, then import the JSON.
 *
 * Converting a new invoice-register PDF:
 *   pip install pdfplumber
 *   python3 backend/scripts/convert-invoices-pdf.py <path-to.pdf>
 *   -> writes <path-to.pdf's folder>/invoices.json
 *
 * Then:
 *   railway run node backend/scripts/import-invoices.js <path-to-invoices.json>
 *
 * Idempotent per documentNo (the "IN103xxx" invoice number) — re-running
 * updates that invoice instead of duplicating it.
 */
import path from 'node:path'
import { readFileSync } from 'node:fs'
import 'dotenv/config'
import { pool } from '../db.js'
import { insertEntity, listEntity, uid, now } from '../store.js'

const filePath = process.argv[2] || path.join(import.meta.dirname, 'data', 'invoices-2020-03-04.json')

async function importInvoices() {
  console.log(`[import-invoices] Reading ${filePath} ...`)
  const raw = JSON.parse(readFileSync(filePath, 'utf8'))
  const { sourceFile, invoices = [] } = raw
  if (!invoices.length) throw new Error('No invoices found in this JSON file')

  const existing = await listEntity('invoices')
  let created = 0
  let updated = 0

  for (const inv of invoices) {
    const match = existing.find((e) => e.documentNo === inv.documentNo)
    const id = match?.id ?? uid()
    await insertEntity('invoices', {
      id,
      documentNo: inv.documentNo,
      date: inv.date,
      account: inv.account,
      yourReference: inv.yourReference || '',
      taxExempt: !!inv.taxExempt,
      taxType: inv.taxType || 'Inclusive',
      client: inv.client || '',
      clientAddress: inv.clientAddress || [],
      deliverTo: inv.deliverTo || [],
      lineItems: inv.lineItems || [],
      subtotal: inv.subtotal ?? 0,
      discountPct: inv.discountPct ?? 0,
      discountAmount: inv.discountAmount ?? 0,
      amountExclTax: inv.amountExclTax ?? 0,
      tax: inv.tax ?? 0,
      total: inv.total ?? 0,
      sourceFile: sourceFile || path.basename(filePath),
      createdAt: match?.createdAt ?? now(),
      importedAt: now(),
    })
    match ? updated++ : created++
  }

  const totalValue = invoices.reduce((s, i) => s + (i.total ?? 0), 0)
  console.log(`[import-invoices] ${created} new, ${updated} updated. Total value: R${totalValue.toFixed(2)}`)
  await pool.end()
  console.log('[import-invoices] Done.')
}

importInvoices().catch((err) => {
  console.error('[import-invoices] Failed:', err)
  process.exit(1)
})
