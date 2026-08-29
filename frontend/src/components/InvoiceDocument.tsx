import type { Invoice } from '@/lib/types'

const fmt2 = (n: number) => (isFinite(n) ? n : 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Read-only facsimile of the printed Straatwerk / OPHELP Projekte Tax
 * Invoice — same visual template as the partner-facing InvoiceModal in the
 * Quotation Builder, driven by a real persisted Invoice record. */
export default function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  return (
    <div className="bg-white font-serif text-black" style={{ border: '1px solid #1C2A28' }}>
      <div className="px-8 py-6">
        <div className="flex justify-between gap-4 mb-3.5 flex-wrap">
          <div className="flex gap-3 items-start">
            <div className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center text-2xl flex-shrink-0">✎</div>
            <div>
              <p className="text-xl font-bold tracking-wide m-0 mb-1">STRAATWERK</p>
              <p className="text-xs leading-relaxed m-0">
                Registered NPO: NPO 003-276<br />
                Registered PBO 930008075<br />
                The body of Christ in Action<br />
                Operations Office: 021425 0140
              </p>
            </div>
          </div>
          <div className="border border-black min-w-[230px]">
            <div className="text-center font-bold p-1.5 border-b border-black">{invoice.taxExempt ? 'Tax Exempt Invoice' : 'Tax Invoice'}</div>
            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm gap-2.5">
              <span className="font-bold">Date</span><span>{invoice.date ? new Date(invoice.date).toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm gap-2.5">
              <span className="font-bold">Account</span><span>{invoice.account || '—'}</span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-1.5 text-sm gap-2.5">
              <span className="font-bold">Document No</span><span>{invoice.documentNo || '—'}</span>
            </div>
          </div>
        </div>

        <div className="text-sm leading-relaxed mb-3.5">
          Straatwerk - OPHELP Projekte<br />PO Box 910<br />PAROW<br />7449<br />
          {invoice.yourReference && <>Your reference: {invoice.yourReference}<br /></>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-0">
          <div className="border border-black p-2">
            <div className="font-bold text-sm mb-1.5 border-b border-black pb-1">Bill to</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ minHeight: 74 }}>{invoice.client}{invoice.clientAddress.length > 0 && <>{'\n'}{invoice.clientAddress.join('\n')}</>}</div>
          </div>
          <div className="border border-black p-2">
            <div className="font-bold text-sm mb-1.5 border-b border-black pb-1">Deliver to</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ minHeight: 74 }}>{invoice.deliverTo.join('\n') || '—'}</div>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '14%' }}>Code</th>
                <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '52%' }}>Description</th>
                <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '17%' }}>Tax</th>
                <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '17%' }}>Nett Price</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.length === 0 ? (
                <tr><td colSpan={4} className="border border-black p-2 text-center text-gray-400 italic">No line items</td></tr>
              ) : invoice.lineItems.map((li, i) => (
                <tr key={i}>
                  <td className="border border-black p-1">{li.code}</td>
                  <td className="border border-black p-1">{li.description}</td>
                  <td className="border border-black p-1 text-right">{fmt2(li.tax)}</td>
                  <td className="border border-black p-1 text-right">{fmt2(li.nettPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid mt-5 gap-4 items-start" style={{ gridTemplateColumns: '1fr 260px' }}>
          <div className="border border-black p-2.5 text-sm leading-relaxed">
            <div>ABSA Parow B/C 632005</div>
            <div>OPHELP Projekte</div>
            <div>Account # 9150624420</div>
            <div className="mt-2">Received in good order</div>
            <div className="mt-5">Signed___________________ &nbsp;&nbsp; Date__________________</div>
          </div>
          <div className="border border-black">
            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Sub Total</span><b>{fmt2(invoice.subtotal)}</b></div>
            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Discount @ {invoice.discountPct}%</span><b>{fmt2(invoice.discountAmount)}</b></div>
            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Amount Excl Tax</span><b>{fmt2(invoice.amountExclTax)}</b></div>
            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Tax</span><b>{fmt2(invoice.tax)}</b></div>
            <div className="flex justify-between items-center px-2.5 py-1.5 text-base font-bold"><span>Total ({invoice.taxType})</span><b>{fmt2(invoice.total)}</b></div>
          </div>
        </div>
        {invoice.sourceFile && <div className="text-center text-xs text-gray-500 mt-2.5">Source: {invoice.sourceFile}</div>}
      </div>
    </div>
  )
}
