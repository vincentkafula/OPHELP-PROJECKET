# OPHELP Platform

Straatwerk's OPHELP voucher & field-operations system — a React marketing
site with an authenticated operations dashboard (participants, shifts,
OPHELP Cards, payments, partner shops, ATM network, projects, equipment,
incidents, and more), now backed by a real Node.js/Express API and
PostgreSQL database instead of the original browser-localStorage demo data.

```
ophelp-platform/
├── frontend/          React + Vite + TypeScript app (the original UI, unchanged in behaviour)
├── backend/           Express + PostgreSQL API
├── railway.json        Railway build/start/healthcheck config
├── nixpacks.toml        Pins the Node version for Railway's builder
├── Procfile             Fallback for platforms that read Procfile instead
└── package.json          Root orchestrator: builds frontend, starts backend
```

## How the frontend talks to the backend

The original app kept all of its data in `localStorage` via a
`Collection<T>` class with `all() / where() / insert() / update() / delete()`
methods, and every component reads through that via `lib/api.ts` and
`context/AppContext.tsx`.

Rather than rewrite every component, `frontend/src/lib/db.ts` now implements
the **same `Collection<T>` interface** on top of an in-memory cache that is:

1. **Hydrated once** at app start from `GET /api/bootstrap`, which returns
   every entity in one call (see `frontend/src/App.tsx` — it calls
   `bootstrap()` before rendering, showing a brief loading screen).
2. **Written through** on every mutation: `insert/update/delete` update the
   local cache immediately (so the UI feels instant, exactly like before)
   and fire the matching `POST/PUT/DELETE /api/<entity>` request to the
   backend in the background.

This means `lib/api.ts` (all the shift-approval, card-issuing,
payment-processing business logic) and every dashboard component work
**unchanged** — only `lib/db.ts` and `lib/auth.ts` needed to be swapped out.

Login (`lib/auth.ts`) is the one fully-async path: it calls
`POST /api/auth/login`, which checks the password with bcrypt and returns a
JWT. The token + safe user object are cached in `sessionStorage`, so
`AuthService.currentUser()` stays synchronous for existing call sites, and a
refresh restores the session automatically until the 8-hour token expires.

## Backend architecture

Every entity (users, participants, shifts, cards, payments, transactions,
partner shops, ATM locations, projects, equipment, inventory, incidents,
notifications, messages, audit logs, teams, skills) is stored as a JSONB
document in one Postgres table (`backend/schema.sql`):

```sql
CREATE TABLE store (
  entity     VARCHAR(64) NOT NULL,
  id         VARCHAR(64) NOT NULL,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity, id)
);
```

This mirrors the flexible, loosely-typed shape the frontend already used,
so the API is a thin, mostly-generic CRUD layer (`backend/routes/generic.js`)
instead of nineteen hand-written tables. `backend/routes/auth.js` and
`backend/routes/bootstrap.js` are the two bespoke routes; everything else
is `GET/POST/PUT/DELETE /api/<entity>[/:id]`.

## Local development

You'll need Node 20+ and a PostgreSQL database (a free one on
[Railway](https://railway.app) or [Neon](https://neon.tech) works fine for
local dev too — you don't need Postgres installed locally).

```bash
# 1. Install everything
npm run install:all

# 2. Configure the backend
cp backend/.env.example backend/.env
# edit backend/.env — set DATABASE_URL to your Postgres connection string
# and JWT_SECRET to a long random string

# 3. Create the schema, then seed demo data (users, sites, shifts, ...)
npm run migrate
npm run seed

# 4. Run frontend and backend separately (two terminals)
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173 (proxies API calls per VITE_API_URL)
```

Copy `frontend/.env.example` to `frontend/.env` and set
`VITE_API_URL=http://localhost:4000/api` so the dev server (a different
origin than the backend) knows where to send API calls.

**Demo logins** (created by `npm run seed`):

| Role | Email | Password |
|---|---|---|
| System Administrator | admin@ophelp.org | Admin@123 |
| Site Foreman | foreman@ophelp.org | Foreman@123 |
| Day Administrator | dayadmin@ophelp.org | DayAdmin@123 |
| Operation Office | opoffice@ophelp.org | OpOffice@123 |
| Operation Management | opmanage@ophelp.org | OpManage@123 |
| OPHELP Store Manager | store@ophelp.org | Store@123 |
| Project Manager | projman@ophelp.org | ProjMan@123 |
| Head Office Executive | headoffice@ophelp.org | HeadOffice@123 |
| Partner Shop Owner | partner@ophelp.org | Partner@123 |
| Team Member | team@ophelp.org | Team@123 |

## Deploying to Railway

1. **Push this repo to GitHub** (see below), then in Railway: **New
   Project → Deploy from GitHub repo** and pick it.
2. **Add a PostgreSQL plugin** to the project (Railway auto-injects
   `DATABASE_URL` into your service — you don't set it by hand).
3. **Set one environment variable** on the service: `JWT_SECRET` — generate
   one with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. Railway will detect `railway.json` and:
   - **Build**: `npm run build` — installs both `frontend/` and `backend/`
     dependencies, then builds the Vite frontend into `frontend/dist`.
   - **Start**: `npm start` — runs the Express backend, which serves the
     built frontend as static files and handles `/api/*` itself. One
     service, one URL, no CORS to worry about in production.
   - **Health check**: `GET /api/health`.
5. **Run the migration once** after the first successful deploy (via the
   Railway CLI, from your machine, pointed at the deployed service):
   ```bash
   railway link          # link this repo to the Railway project
   railway run npm run migrate --prefix backend
   railway run npm run seed --prefix backend
   ```
   (`seed` is idempotent — it checks for existing users and skips if the
   database already has data, so it's safe to leave in a deploy script if
   you'd rather not run it manually.)

You mentioned you'll provide the GitHub token separately — once you do,
push with:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## Payroll (Operation Office)

The **Payroll** tab under the Operation Office role manages Straatwerk-style
paysheet runs — periods, daily paysheet lines, corrections/deductions
(medical aid, staff loans, training fund, etc.), and a payroll roster
(file number, name, ABSA beneficiary number, payroll code).

Data model (four new generic entities, same JSONB pattern as everything
else — see `backend/server.js` / `backend/routes/bootstrap.js`):

- `payroll_periods` — one payroll run (number + label, e.g. "71 — 25 Feb - 03 Mar 2026")
- `payroll_roster` — one payee per file number, optionally linked to a `Participant`
- `payroll_entries` — one line per person/day/task (hours + amount)
- `payroll_corrections` — one line per deduction/addition against a person for a period

The dashboard screen (`frontend/src/components/PayrollPanel.tsx`) lets
Operation Office create a new period, add entries/corrections by hand, see
a per-person payslip summary (hours, gross, corrections, net payable),
and export that summary as CSV for the bank run.

**Importing a Paybook (.mdb) export.** The old Access paybooks
(`Paybook_0NN_<period>.mdb`) aren't readable by Node directly. On a
machine with `mdbtools` installed, export each table (`tblPayrollPeriode`,
`tblNames`, `tblDays`, `tblDetail`, `tblPaysheet`, `tblCorrections`) to CSV
and join them into the flat JSON shape documented at the top of
`backend/scripts/import-payroll.js`. `backend/scripts/data/paybook-071.json`
is a worked example (Payroll 71, 25 Feb – 03 Mar 2026) produced this way.
Then run:

```
railway run npm run import:payroll --prefix backend -- backend/scripts/data/paybook-071.json
```

(or `npm run import:payroll --prefix backend -- <path-to-json>` locally,
with `DATABASE_URL` pointed at the target database). The import is
idempotent per period number — re-running it replaces that period's
entries/corrections instead of duplicating them, and it links roster rows
to existing `Participant` profiles where the names match.

## Payment Authorisations (Operation Office)

The **Payment Authorisations** tab covers OPHELP's "PA slip" workflow —
one-off or recurring expense sign-offs (direct debits, supplier invoices,
etc.), each identified by a PA number (e.g. "01 001"). This is a separate
concept from [Payroll](#payroll-operation-office): payroll is participant
wages for a period, a PA is a single authorised payment to a payee (a
supplier, a medical scheme, etc.) against an expense account/column.

Data model: one new generic entity, `payment_authorisations` — PA number,
date, compiler, payee, bank details, amount, details, authorisation
type, expense account/column, caption, client, an invoice breakdown
(pay/transport/material/admin/other/fee), and a status
(`captured` → `authorised` → `paid`).

The dashboard screen (`frontend/src/components/PaymentAuthorisationsPanel.tsx`)
lists all authorisations with search, a monthly-total/awaiting-payment/paid
summary, a "New Authorisation" form, a detail view with status buttons,
and CSV export.

**Importing a PA slip (.xlsx).** Unlike the Access paybooks, these are
plain spreadsheets, so `backend/scripts/import-payment-authorisation.js`
parses one directly with the `xlsx` package — no conversion step needed:

```
railway run npm run import:payment-authorisation --prefix backend -- backend/scripts/data/PA_01_001_HEALTH4ME_Payment_March_2026.xlsx
```

(or run it locally with `DATABASE_URL` pointed at the target database).
The parser is label-driven (it looks for cells like `Amount:`, `Compiler:`,
`Caption:` and reads the next real value in that row) so it tolerates the
small row/column shifts between one PA slip and the next as long as the
labels stay the same. It's idempotent per PA number — re-running it with
the same file updates that record instead of duplicating it.

## Weekly Registers & Accsys GL Export (Operation Office)

Three more source documents feed the Operation Office dashboard, all
handled without any conversion step (both are plain `.xlsx`, parsed
directly with the `xlsx` package):

**Weekly Registers.** OPS Office / Coaching Leadership / Leave Register /
Payroll Register cover sheets are one family of weekly sign-off sheet —
a header (period, payroll number, prepared/checked/signed-off by), a run
of lines (either one row per person with Hours + Rate sub-rows, or one
flat row per category), and an "OASys Details" section that turns the
week's totals into OASys invoicing accounts (Pay / Extra / Sub-Total /
Admin Fee / Invoice Value). They're stored as one new entity,
`weekly_registers`, and shown on the **Weekly Registers** tab
(`frontend/src/components/WeeklyRegistersPanel.tsx`) with a type filter,
a detail view (day-by-day grid + OASys breakdown), and CSV export.

Import with `backend/scripts/import-weekly-register.js` — it reads every
sheet in a workbook (or just one, if you pass a sheet name) and creates
one register per sheet:

```
railway run npm run import:weekly-register --prefix backend -- backend/scripts/data/Coaching_Leadership_and_Coaching_Administration_1.xlsx
railway run npm run import:weekly-register --prefix backend -- backend/scripts/data/Payroll_Register_097__26_August_-_01__September__2026.xlsx
```

The parser locates the day columns and the TOTAL column by content (not
fixed positions), since the exact column layout drifts a little between
sheets — e.g. some have an "Hrs Quota" column and some don't. It's
idempotent per (source file, sheet name).

**Accsys GL Export.** `qryAccsysExport_*.xlsx` is the department/GL-code
grouped report OPHELP pushes into their Accsys accounting system —
one row per payee, grouped under department headings, with a GL code per
department. `backend/scripts/import-accsys-export.js` reads it and:
sets `department` + `glCode` on the matching `payroll_roster` entries
(now shown as columns on the Payroll tab's roster table), creates/updates
the corresponding Payroll Period, and records any non-zero "Medical Aid"
/ "Training Fund/Loan Repayment" figures as `payroll_corrections` — the
same correction shape the Paybook importer uses.

```
railway run npm run import:accsys-export --prefix backend -- backend/scripts/data/qryAccsysExport_Payroll_Template.xlsx
```

It deliberately doesn't create `payroll_entries` — this report has
per-person totals only, no day/task detail, so hours/gross pay still come
from the Paybook (`import-payroll.js`).

## OASys Reconciliation (Operation Office)

`Checking_OAYS.xlsx` is a multi-year weekly reconciliation log (one sheet
per month, back to late 2022) that checks OASys ledger totals against the
field registers (Jobsheets, Cash Vouchers) — every week has a pair of
summary rows (historically "OASys Value" / "Payroll Value", more recently
just "Correct") followed by a difference row that should be all zeros.

Rather than model every individual transaction row (the layout is a
personal working sheet and drifts release to release), `backend/scripts/import-oasys-checks.js`
extracts the reconciliation itself — the two weekly totals being compared
and whether they balanced — which is both the actual point of the sheet
and far more reliably extractable across 150+ historical weeks than the
line-item detail is. It scans every sheet in the workbook for 7-day
header blocks followed by a near-zero difference row, and skips sheets
that don't match the pattern (the rough scratch sheets in this workbook,
"Sheet1"/"Sheet2"/"Sheet3", are skipped automatically).

The **OASys Reconciliation** tab (`frontend/src/components/OasysChecksPanel.tsx`)
lists every imported week with a Balanced/Discrepancy badge, an
"Unbalanced Only" filter, and a day-by-day detail view. Verified against
the real workbook: 178 weeks across 37 sheets, with exactly one genuine
discrepancy found (a R75 mismatch in one August 2024 week).

```
railway run npm run import:oasys-checks --prefix backend -- backend/scripts/data/Checking_OAYS.xlsx
```

Idempotent per (source file, sheet, week start date) — safe to re-run
after the source workbook gets new months appended.

## Depot Schedules (Operation Office)

Daily depot schedule documents (e.g. `Maintenance_Depot_Day_Schedule_24_Aug_26.docx`)
are Word docs, not spreadsheets, but the same "read the source format
directly" approach applies: `backend/scripts/import-depot-schedule.js`
renders the doc to HTML with `mammoth` (which — unlike a plain text
extraction — preserves table structure, including a nested table used
for each shift's foreman/confirmation columns) and walks it with
`cheerio`.

Each document has two tables:
- **Shifts** — one row per task (title, scheduled hours, foreman, and the
  list of booked participants), each with Confirmed/Reported/SMS flags
- **Depot office roster** — Morning/Afternoon assignment per role (Ops
  Supervisor, Administrator, Data Processor, Stock Controllers, etc.)

Both land in one `depot_schedules` entity per (depot name, date), shown
on the **Depot Schedules** tab (`frontend/src/components/DepotSchedulesPanel.tsx`) —
a schedule picker, stat cards, the shift table with booked-participant
badges, and the office roster table.

```
railway run npm run import:depot-schedule --prefix backend -- backend/scripts/data/Maintenance_Depot_Day_Schedule_24_Aug_26.docx
```

Idempotent per (depot name, date) — re-importing an updated version of
the same day's schedule replaces that record. Note: cheerio's HTML
parser wraps bare table rows in an implicit `<tbody>`, which the parser
accounts for — worth remembering if this importer is ever extended for
other docx table formats.

## Quotations (Operation Office + Partners)

`QUOTATION_CHECK_-_CIDC.xlsx` is a job-costing template used to quote
work before it starts (as opposed to [OASys](#weekly-registers--accsys-gl-export-operation-office),
which invoices work already done) — line items grouped by Supervision /
Labour / Materials / Transport, rolling up to a Subtotal, a 25% Admin
Fee, an optional Management Fee, and a Quotation Total. Every sheet in
the workbook is a separate quote; the sheet name becomes the quotation's
title (`backend/scripts/import-quotations.js`, one `quotations` entity
per sheet, only line items with a non-zero amount are kept — the
template's many blank placeholder rows are skipped). Verified against
the real workbook: 6 quotations across 6 sheets (a 7th, empty, sheet is
skipped) with totals matching the source exactly, e.g. CIDC R9,147.95,
Harrington Park Tarring R29,785.73.

```
railway run npm run import:quotations --prefix backend -- backend/scripts/data/QUOTATION_CHECK_-_CIDC.xlsx
```

The **Quotations** tab (`frontend/src/components/QuotationsPanel.tsx`) is
shared between two roles:
- **Operation Office** gets full management — assign a client, move a
  quotation through draft → sent → approved/rejected, and see every
  quotation.
- **Partner** gets a read-only view scoped to their own shop
  (`clientFilter` matched against the partner's `PartnerShop.name` — a
  quotation only shows up for a partner once Operation Office has typed
  their shop name into the quotation's Client field, since the import
  itself has no client information to go on).

Idempotent per (source file, sheet name).

## Invoices (Operation Office + Partners)

`1787833848051_2019_03-04_March_and_April_Invoices_A.pdf` is a "Copy Tax
Invoice" register — the actual invoices issued to partners/clients (CIDs,
hotels, churches, property managers, etc.), one page per invoice.

Node doesn't have a good position-aware PDF text reader (unlike Python's
`pdfplumber`, which gives per-word x/y coordinates), and that matters
here: the "To" and "Deliver to" address blocks sit side by side and
collide in a plain text dump whenever the client name is long enough to
run into the second column's position. So, like the Payroll `.mdb`
importer, this is a convert-then-import flow:

```
pip install pdfplumber
python3 backend/scripts/convert-invoices-pdf.py <path-to.pdf>   # writes invoices.json next to it
railway run npm run import:invoices --prefix backend -- <path-to-invoices.json>
```

`backend/scripts/data/invoices-2020-03-04.json` is the worked example
from the uploaded register — verified against the source PDF: 57
invoices, all document numbers unique, dates spanning 2 Mar – 21 Apr
2020, R879,960.16 total across 43 distinct clients.

Each invoice becomes one `invoices` entity (document number, date,
account code, client name/address, delivery address, line items,
subtotal/discount/tax/total). Idempotent per document number.

The **Invoices** tab (`frontend/src/components/InvoicesPanel.tsx`) is
shared between roles the same way [Quotations](#quotations-operation-office--partners)
is: Operation Office sees the full register with CSV export; Partner
sees only invoices whose `client` field matches their `PartnerShop.name`.

## Jobsheets — Money Engine (Foreman → Operation Office → Accounting → Partner)

This implements the financial core of the "Field Services Operations
Platform" spec: a Jobsheet's exact pay/6X-Reward/material/admin-fee
calculation, serial numbering, the OpHelp Accounting ledger, and the
partner monthly invoice rollup. It's a deliberately scoped slice of a
much larger spec (quotation requests, the 3-stage approval chain,
scheduling, team booking, and day-admin roll-call/deployment are **not**
built yet) — this is the piece everything else would eventually feed
into.

**Flow:** Foreman creates a Jobsheet (**Jobsheets** tab) after a shift,
entering the team's pay (cash/EFT per person), bags/gloves counts,
transport, and any extra. It computes live as you type. Foreman submits
→ Operation Office reviews (**Jobsheet Review** tab) and confirms, which
assigns the serial number and makes it appear in **OpHelp Ledger**. A
partner's confirmed Jobsheets roll up into a **Monthly Invoice**
(Operation Office finalizes it; the partner sees it read-only under
**Monthly Invoice** on their own dashboard).

**Calculation** (`computeJobsheetFinancials` in `frontend/src/lib/api.ts`
— the single source of truth used by both the live entry-form preview
and the ledger):
1. Cash / EFT = sum of the team's per-person payments by method.
2. 6X Reward = unqualified team only — R10/member (4h) or R20/member (8h).
3. Pay Amount = Cash + EFT + 6X Reward — should equal the contracted
   labour total (R385 or R365, set per Jobsheet); the entry form warns
   if it doesn't.
4. Material = (bags used × R1.94) + (gloves used × R7.50), zero if the
   contract's "client pays direct" toggle is on.
5. Subtotal = Cash + EFT + Extra + 6X Reward + Transport + Material + Other.
6. Admin Fee = Subtotal × fee rate (defaults to 25%, editable per Jobsheet).
7. Invoice Amount = Subtotal + Admin Fee.

**Flagged assumptions** (the source spec left these ambiguous — each is
also documented as a comment on the `Jobsheet` type in
`frontend/src/lib/types.ts`):
- The spec's own print-form UI (`JobSheet.tsx`) shows **two** named
  accounts per Jobsheet, but the calculation section gives one set of
  formulas with no per-account split defined. Rather than invent a
  split, this computes **one** financial result per Jobsheet and keeps
  `accountName` as a single free-text label.
- "Extra" (pay beyond the contracted total) is a manual field, not
  derived by subtraction — matching the spec's own wording that Extra is
  "recorded separately."
- "Other" isn't listed in the subtotal formula's terms but does have its
  own ledger column with a real cost behind it, so it's included in the
  subtotal — excluding a real cost would under-bill the client.
- The serial number follows the literal "8-digit, DDMMYY + 2-digit daily
  sequence" rule, not the spec's own inconsistent `EG260827010` example.
- Admin fee rate defaults to 25% but is editable per Jobsheet, since the
  ledger has its own "Fee Rate %" column implying it varies.
- The OpHelp Accounting ledger tracks Transport/Material/Admin/Other as
  single amounts rather than cash/EFT pairs — only team labour pay
  differentiates cash vs EFT per person; the spec doesn't say how the
  other categories are paid out.
- For an unqualified team, Cash+EFT+6X-Reward will generally **not**
  equal R365/R385 (the unqualified base rates sum to R270), which the
  entry form will flag as a mismatch — this is a literal reading of the
  spec's own formula, not a bug; reconcile the difference with the Extra
  field per Jobsheet.

## Known limitations / follow-ups

- The admin **"Add User"** screen in the dashboard (`Dashboard.tsx`) still
  passes the raw password straight into `passwordHash` without hashing
  client-side (a pre-existing quirk from the original app, not something
  introduced here). The login route on the backend detects this (a
  non-bcrypt hash) and falls back to a direct comparison, then upgrades the
  stored value to a real bcrypt hash on that user's first successful login
  — so it works end-to-end, but the cleanest fix going forward is to change
  that form to call `POST /api/users` with a `password` field and let the
  server hash it.
- Because writes are optimistic (cache updates immediately, network call
  happens in the background), a failed write is currently just logged to
  the browser console rather than surfaced in the UI or rolled back. Fine
  for a first real-backend pass; worth adding a toast/retry layer later if
  the network proves unreliable in the field.
- CORS is wide open (`cors()` with no options) since frontend and backend
  ship as one Railway service. If you ever split them into two services,
  lock this down to the frontend's origin.
- Payroll roster matching (`backend/scripts/import-payroll.js`) links a
  roster row to a `Participant` by exact-normalized name match only. Do a
  manual review pass after each import — nicknames, initials, or spelling
  differences between the Paybook and the participant register won't
  auto-link, and will just show as "Unmatched" in the Payroll tab until
  reconciled by hand.
- The weekly-register parser (`backend/scripts/import-weekly-register.js`)
  is label/position-driven, not a fixed template, so it copes with the
  small layout drift seen between sheets — but a sheet that renames
  "Hours"/"Rate"/"TOTAL"/"OASys Details" to something else, or drops the
  day-of-week header row entirely, won't be recognised and will just be
  skipped with a console message rather than silently importing wrong
  numbers. Spot-check a newly-imported register against its source sheet
  once before relying on it.
- The OASys checker (`backend/scripts/import-oasys-checks.js`) finds its
  weekly totals by position (the two numeric rows directly above a
  near-zero difference row), not by the row labels, since those labels
  changed wording over the workbook's history ("OASys Value"/"Payroll
  Value" in older sheets, "Correct" in newer ones). On the rare block
  where a label cell is missing or a date is mistyped in the source
  sheet, the check still imports but shows a generic "Total A"/"Total B"
  label or an odd week-end date — the discrepancy figure itself is still
  reliable, just double-check the label/dates for that one week before
  citing it.
- The invoice PDF converter (`backend/scripts/convert-invoices-pdf.py`)
  splits the account line into code / reference / tax-exempt flag by
  scanning tokens for a standalone "Y" or "N". On the rare invoice whose
  reference text itself starts with "Y" or "N" (e.g. a reference like "N
  MSILA"), that token gets read as the tax-exempt flag instead of part of
  the reference, so the reference field comes out short for that one
  invoice — the financial figures are unaffected, only that one text
  field.
