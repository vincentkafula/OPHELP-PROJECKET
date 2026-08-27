"""
Converts an OPHELP "Copy Tax Invoice" register PDF into the flat JSON
shape backend/scripts/import-invoices.js expects.

Each page is one invoice: date, document number, account code, client
("To") name/address, delivery address, line items (code/description/tax/
nett price), and the subtotal/discount/tax/total block.

The "To" and "Deliver to" address blocks sit in two columns that collide
in a plain text dump whenever the client name is long enough to run into
the second column's horizontal position — so this uses pdfplumber's
per-word x/y coordinates (extract_words) to bucket words into columns by
their actual position on the page, rather than parsing a flattened text
stream.

Usage:
    pip install pdfplumber
    python3 convert-invoices-pdf.py <path-to.pdf> [output.json]

Writes <output.json> (default: invoices.json next to the input file).
"""
import pdfplumber, re, json, sys, os

def parse_num(s):
    if s is None: return None
    s = str(s).replace(',', '').strip()
    if s in ('', '-'): return None
    try: return float(s)
    except: return None

def group_rows(words, x_threshold=260, y_tol=3):
    """Group words into (top, left_text, right_text) rows by y-position, splitting columns by x0."""
    rows = {}
    for w in words:
        key = round(w['top'] / y_tol) * y_tol
        rows.setdefault(key, []).append(w)
    result = []
    for top in sorted(rows.keys()):
        ws = sorted(rows[top], key=lambda w: w['x0'])
        left = ' '.join(w['text'] for w in ws if w['x0'] < x_threshold)
        right = ' '.join(w['text'] for w in ws if w['x0'] >= x_threshold)
        result.append((top, left, right))
    return result

def parse_invoice(page):
    full = page.extract_text()
    words = page.extract_words()

    date_m = re.search(r'Date\s+(\d{2}/\d{2}/\d{4})', full)
    d, m, y = date_m.group(1).split('/')
    iso_date = f'{y}-{m}-{d}'
    docno = re.search(r'Document No\s+(\S+)', full).group(1)

    plines = full.split('\n')
    ah = next(i for i,l in enumerate(plines) if l.strip() == 'Account Your Reference Tax Exempt Tax Reference Sales Code')
    acc_raw = plines[ah+1].strip()
    toks = acc_raw.split()
    account = toks[0]
    tax_type = toks[-1] if toks[-1] in ('Inclusive','Exclusive') else ''
    tax_exempt = 'N'
    ref_toks = []
    seen_flag = False
    for t in toks[1:]:
        if t in ('Y','N'): tax_exempt = t; seen_flag = True; continue
        if t in ('Inclusive','Exclusive'): continue
        if not seen_flag: ref_toks.append(t)
    your_reference = ' '.join(ref_toks)

    # Address block via word coordinates: rows between "Deliver to" label and "Account Your Reference" header
    rows = group_rows(words)
    deliver_label_top = next(top for top,l,r in rows if 'Deliver to' in r or 'Deliver to' in l)
    header_top = next(top for top,l,r in rows if 'Account' in l and 'Your' in l and 'Reference' in l)
    to_block, deliver_block = [], []
    for top, left, right in rows:
        if deliver_label_top < top < header_top:
            if left.strip(): to_block.append(left.strip())
            if right.strip(): deliver_block.append(right.strip())
    client = to_block[0] if to_block else ''
    client_address = to_block[1:]
    deliver_to = deliver_block

    # Line items
    code_hdr = next(i for i,l in enumerate(plines) if l.strip().startswith('Code Description'))
    subtotal_idx = next(i for i,l in enumerate(plines) if l.strip().startswith('Sub Total'))
    items = []
    for l in plines[code_hdr+1:subtotal_idx]:
        l = l.strip()
        if not l: continue
        mm = re.match(r'^(\d{6,7})\s+(.*?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$', l)
        if not mm:
            continue
        items.append({
            'code': mm.group(1), 'description': mm.group(2).strip(),
            'quantity': None, 'unit': None, 'unitPrice': None, 'discPct': None,
            'tax': parse_num(mm.group(3)), 'nettPrice': parse_num(mm.group(4)),
        })

    subtotal = parse_num(re.search(r'Sub Total\s+([\d,]+\.\d{2})', full).group(1))
    disc_m = re.search(r'Discount @\s*([\d.]+)%\s*([\d,]+\.\d{2})', full)
    discount_pct = float(disc_m.group(1)) if disc_m else 0.0
    discount_amt = parse_num(disc_m.group(2)) if disc_m else 0.0
    amount_excl_tax = parse_num(re.search(r'Amount Excl Tax\s+([\d,]+\.\d{2})', full).group(1))
    tax_m = re.search(r'(?<!Excl )\bTax\s+([\d,]+\.\d{2})', full)
    tax = parse_num(tax_m.group(1)) if tax_m else None
    total_m = re.search(r'(?<!Sub )(?<!Excl )\bTotal\s+([\d,]+\.\d{2})', full)
    total = parse_num(total_m.group(1)) if total_m else None

    return {
        'documentNo': docno, 'date': iso_date, 'account': account,
        'yourReference': your_reference, 'taxExempt': tax_exempt == 'Y', 'taxType': tax_type,
        'client': client, 'clientAddress': client_address, 'deliverTo': deliver_to,
        'lineItems': items, 'subtotal': subtotal, 'discountPct': discount_pct,
        'discountAmount': discount_amt, 'amountExclTax': amount_excl_tax, 'tax': tax, 'total': total,
    }

results = []
pdf_path = sys.argv[1] if len(sys.argv) > 1 else '1787833848051_2019_03-04_March_and_April_Invoices_A.pdf'
out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(pdf_path)), 'invoices.json')

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        try:
            results.append(parse_invoice(page))
        except Exception as e:
            print(f'FAILED page {i}: {e}', file=sys.stderr)

print(f'Parsed {len(results)} invoices')
with open(out_path, 'w') as f:
    json.dump({'sourceFile': os.path.basename(pdf_path), 'invoices': results}, f, indent=1)

bad_tax = [r for r in results if r['tax'] is None or r['total'] is None]
print('rows with missing tax/total:', len(bad_tax))
total_sum = sum(r['total'] for r in results if r['total'])
print('Total invoiced:', round(total_sum, 2))
print('Distinct clients:', len(set(r['client'] for r in results)))
print('Wrote', out_path)
