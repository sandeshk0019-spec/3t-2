# 3T (Time To Time) Dairy Financial & Micro-Fintech Ecosystem
## Comprehensive System Specification & Feature Reference Manual

---

## 1. Executive Summary & Core Philosophy

**3T (Time To Time) Dairy** is a real-time, quality-indexed dairy payment and micro-fintech ecosystem engineered specifically for the Indian dairy supply chain.

### The Problem Solved
In conventional dairy farming, over 100 million Indian dairy farmers deliver milk twice daily to rural collection centers. However, their payment cycles are delayed by **10 to 30 days**, prone to manual ledger calculation errors, lack FAT/SNF transparency, and trap smallholders in perpetual cash-flow deficits.

### The 3T Paradigm: "Milk Now, Money Now"
3T transforms milk collection centers into automated micro-fintech nodes. The moment milk is weighed and tested:
1. The **quality-indexed rate** is calculated instantaneously down to the exact paisa.
2. An **instant UPI settlement order** is dispatched to the farmer’s linked bank account.
3. The farmer’s **Digital Passbook Ledger** updates in real-time across both mobile and desktop devices.
4. A verifiable **transaction UTR** and timestamped timeline are issued immediately.

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  Farmer Brings  │ ────> │ Digital Collection POS │ ────> │ Quality Formula Engine │
│   Fresh Milk    │       │ (Weight + FAT% + SNF%) │       │ (Base + FAT×F₁ + SNF×F₂)│
└─────────────────┘       └────────────────────────┘       └───────────┬────────────┘
                                                                       │
┌─────────────────────────┐     ┌────────────────────────┐             │
│ Farmer Mobile Passbook  │ <── │ Instant UPI Settlement │ <───────────┘
│ (Real-time PWA Ledger)  │     │ Gateway (Razorpay/Bank)│
└─────────────────────────┘     └────────────────────────┘
```

---

## 2. System Architecture & Dual-Layer Cloud Persistence

The system is built on Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, LowDB local caching, and Supabase PostgreSQL.

```
                                  ┌───────────────────────────────┐
                                  │      Client Applications      │
                                  │ (Dashboard / Farmer Passbook) │
                                  └───────────────┬───────────────┘
                                                  │
                                  ┌───────────────▼───────────────┐
                                  │  Next.js 16 Proxy Middleware  │
                                  │  (Security Headers, RBAC, JWT)│
                                  └───────────────┬───────────────┘
                                                  │
                                  ┌───────────────▼───────────────┐
                                  │       App Router APIs         │
                                  │  (/api/collections, /farmers) │
                                  └───────────────┬───────────────┘
                                                  │
                        ┌─────────────────────────┴─────────────────────────┐
                        │                                                   │
        ┌───────────────▼───────────────┐                   ┌───────────────▼───────────────┐
        │    LowDB Local JSON Cache     │                   │     Supabase Cloud Layer      │
        │  (Fast in-memory read cache)  │                   │ (Relational Tables + Backups) │
        └───────────────────────────────┘                   └───────────────────────────────┘
```

### Dual-Layer Storage Engine (`src/lib/db.ts`)
To guarantee high performance and resilience across serverless deployments (Vercel cold starts, edge nodes):
1. **Primary Relational Cloud Layer**:
   - `farmers`: Stores farmer profiles, banking details (Aadhaar, IFSC, UPI ID, Bank Account), animal counts, and cumulative metrics.
   - `collections`: Stores every milk pouring record (Weight, FAT%, SNF%, Rate, Total, Shift, Center ID).
   - `payments`: Stores settlement records, statuses (`Success`, `Pending`, `Failed`), and step-by-step transaction timelines.
   - `branches`: Stores collection center metadata and hardware configurations.
2. **Cloud Resilience Backup Layer**:
   - Every entity is simultaneously upserted with structured backup records (`FARMER-[id]`, `COL-[id]`, `PAY-[id]`, `CONFIG-FORMULA`) into Supabase.
   - Prevents Foreign Key violations during asynchronous writes.
   - Ensures newly registered farmers and milk deliveries persist through server restarts and serverless container lifecycles.
3. **Optimistic Local Cache**:
   - In-memory/JSON store accelerates reads (`/api/data`, `/api/farmer/[farmerId]/data`) to sub-5ms response times.
   - Background revalidation syncs with Supabase every 2 seconds or on-demand via `refreshFromSupabase(force=true)`.

---

## 3. Dynamic Quality-Indexed Pricing Formula Engine

The rate paid to a farmer is computed automatically using real-time quality parameters.

$$\text{Rate per Liter} = \text{Base Price} + (\text{FAT}\% \times \text{FAT Factor}) + (\text{SNF}\% \times \text{SNF Factor})$$

$$\text{Total Payout} = \text{Rate per Liter} \times \text{Milk Weight (Liters)}$$

### Default Configuration Matrix
- **Base Price**: `₹15.00` per liter
- **FAT Factor**: `5.50` (rewards high butterfat content)
- **SNF Factor**: `2.00` (rewards high Solids-Not-Fat content)

#### Calculation Example:
For Buffalo Milk with **6.5% FAT** and **9.0% SNF**:
- $\text{FAT Addition} = 6.5 \times 5.50 = ₹35.75$
- $\text{SNF Addition} = 9.0 \times 2.00 = ₹18.00$
- $\text{Rate per Liter} = 15.00 + 35.75 + 18.00 = \mathbf{₹68.75/\text{L}}$
- For a delivery of **12.5 Liters**: $\text{Total Payout} = 12.5 \times 68.75 = \mathbf{₹859.38}$

### Dynamic Formula Configuration
- Dairy administrators can update these parameters globally through the **Dashboard Settings Tab**.
- Formula changes are stored under `CONFIG-FORMULA` in Supabase and propagate across all collection centers within seconds without redeploying code.

---

## 4. Farmer Digital Passbook & Real-Time Ledger (`/farmer/[farmerId]`)

The Farmer Passbook is a digital replacement for paper passbooks, designed specifically for smallholder dairy farmers.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 3T Passbook — Ramesh Patil (F-101)                [📲 Add to Phone]    │
│ Central Collection Center B-01 · Bank & UPI Verified     [🖨️ Print]    │
├────────────────────────────────────────────────────────────────────────┤
│ [ Total Volume ]   [ Period Settled ]   [ Avg FAT% ]   [ Avg SNF% ]   │
│    142.5 L            ₹ 6,840.00           4.6%           8.8%         │
├────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search date, shift, rate, UTR...]   [📅 Aug 2026 ▾]  [📆 Pick Date]│
│ 10-Day Cycles: [All Days]  [1st–10th]  [11th–20th]  [21st–End]         │
├────────────────────────────────────────────────────────────────────────┤
│ 2026-08-31 · ☀️ Morning · 12.5 L · FAT 4.5% · SNF 8.7% · ₹562.50 [PAID]│
│ 2026-08-30 · 🌙 Evening · 11.0 L · FAT 4.8% · SNF 8.9% · ₹517.00 [PAID]│
└────────────────────────────────────────────────────────────────────────┘
```

### Key Features & Capabilities

#### 1. 10-Day Billing Cycles (Indian Dairy Dekad System)
In Indian milk co-operatives, payments and audits are processed in 10-day intervals (*आवर्तन*). The passbook includes one-tap 10-day cycle tabs:
- **`All Days`**: Comprehensive historical ledger view.
- **`1st – 10th (Cycle 1)`**: Filters milk delivered between the 1st and 10th of the active month.
- **`11th – 20th (Cycle 2)`**: Filters milk delivered between the 11th and 20th.
- **`21st – End (Cycle 3)`**: Filters milk delivered from the 21st to the month's end.

#### 2. Instant Search & Multi-Parameter Filter Engine
- Real-time search across Date (`YYYY-MM-DD` or text), Shift (`Morning`/`Evening`), FAT%, SNF%, Rate, Payout Amount, and Bank UTR.
- **Month Picker**: Automatically aggregates and displays all months present in the farmer’s history.
- **Exact Date Picker**: A calendar control to jump directly to any specific date.
- **One-Tap Reset**: Clears all filters and returns to the default view.

#### 3. Dynamic Summary Cards
The four summary cards at the top of the passbook update dynamically based on the active filter:
- **Filtered Milk Volume**: Total liters for the selected 10-day cycle or search query.
- **Period Settled Outflow**: Net earnings for the filtered period with UPI settlement indicators.
- **Average FAT%**: True weighted quality average for the selected range.
- **Average SNF%**: Solid quality metric for the selected range.

#### 4. Responsive Dual-Presentation (Mobile Cards & Desktop Table)
- **Desktop View (`md:` and above)**: Full 8-column data grid with high density, sortable columns, and print stylesheets.
- **Mobile View (`< md`)**: Eliminates horizontal scrolling by rendering touch-friendly **Intake Cards**:
  - Top header with Date, Shift badge (`☀️ Morning` / `🌙 Evening`), and green `CREDITED` badge.
  - 4-column quality grid: Volume (L), FAT (%), SNF (%), Rate (₹/L).
  - Bottom bar with Bank UTR reference and bold payout figure.

#### 5. Cross-Device Real-Time Synchronization
- **`BroadcastChannel("3t_realtime_sync")`**: Instant, zero-latency tab-to-tab sync across the same device.
- **10-Second Heartbeat Polling**: Fetches from `/api/farmer/[farmerId]/data` so deliveries logged on a center computer appear on the farmer's mobile screen within 10 seconds.
- **Visual Pulse Indicator**: Animated sync spinner with localized timestamp confirmation.

#### 6. Print & Statement Export
- Built-in print CSS (`print:border-black`, `no-print` hiding UI elements) generates clean, single-page hard copies suitable for bank loan verification.

---

## 5. Farmer PWA & Mobile Installation Engine

The application supports Progressive Web App (PWA) standards for offline and standalone operation on Android and iOS.

```
┌────────────────────────────────────────────────────────┐
│          Dynamic PWA Architecture                      │
│                                                        │
│  /farmer/F-101                                         │
│       │                                                │
│       ▼                                                │
│  <link rel="manifest" href="/api/manifest?farmerId=F-101">
│       │                                                │
│       ▼                                                │
│  Dynamic JSON:                                         │
│  {                                                     │
│    "name": "3T Passbook - Ramesh Patil",               │
│    "start_url": "/farmer/F-101",                       │
│    "display": "standalone",                            │
│    "icons": [192x192, 512x512]                         │
│  }                                                     │
│       │                                                │
│       ▼                                                │
│  Service Worker (/sw.js) Active                        │
│       │                                                │
│       ▼                                                │
│  Native Chrome/Edge Prompt & Home Screen App Icon      │
└────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Dynamic Farmer Web Manifest (`/api/manifest/route.ts`)
- Rather than a generic static manifest, each farmer gets a personalized manifest containing their name (e.g., *"3T Passbook - Ramesh Patil"*).
- The `start_url` and `scope` are set to `/farmer/${farmerId}`, launching directly into their personal ledger when opened from the home screen.

#### 2. Service Worker (`public/sw.js`)
- Pre-caches core brand shell assets, stylesheets, and icons.
- Employs a **Network-First with Cache Fallback** caching strategy.
- Enables Chrome and Edge to trigger the native `beforeinstallprompt` event.

#### 3. Interactive Header Actions (`PassbookHeaderActions.tsx`)
- Captures and defers native browser install prompts.
- **Native 1-Click Trigger**: Direct install prompt on supported browsers.
- **Installed State Detection**: Detects `display-mode: standalone` and displays an *"Installed ✅"* badge.
- **Guided Fallback Modal**: Provides visual instructions tailored to the user's browser (Android Chrome, iOS Safari, Desktop Chrome/Edge).

---

## 6. Farmer Authentication & OTP Gateway

Passwordless authentication designed for usability by rural users.

```
┌────────────────────────────────────────────────────────┐
│                   /farmer/login                        │
│                                                        │
│  Step 1: Enter 10-Digit Mobile Number                  │
│          [ 9876543210 ] ➔ [ Send OTP ]                 │
│                 │                                      │
│                 ▼                                      │
│  Step 2: Auto-Focused 6-Digit OTP Input                │
│          [ 4 ][ 8 ][ 2 ][ 9 ][ 1 ][ 0 ]                │
│                 │                                      │
│                 ▼                                      │
│  Step 3: Verification & Session Generation             │
│          Sets HttpOnly Cookie: '3t_farmer_token'       │
│          Redirects to: /farmer/F-101                   │
└────────────────────────────────────────────────────────┘
```

### Security & Functional Flow
1. **Phone Number Lookup (`/api/auth/farmer-otp/send`)**:
   - Validates that the 10-digit number belongs to an active farmer in the database.
   - Generates a cryptographically secure 6-digit OTP with a 5-minute expiry window.
   - Includes demo OTP support for testing environments.
2. **OTP Verification (`/api/auth/farmer-otp/verify`)**:
   - Verifies the OTP and issues a signed JWT session cookie (`3t_farmer_token`).
   - Cookie is configured with `HttpOnly`, `SameSite=Lax`, and `Path=/`.
3. **Session Verification & Route Protection**:
   - Authenticated farmers are routed to `/farmer/[farmerId]`.
   - Access attempts to other farmers' passbooks are blocked and redirected to the login flow.
   - Secure server-side logout terminates the session via `/api/auth/farmer-otp/logout`.

---

## 7. AI Krishi Mitra — Multilingual Voice & Text Assistant

An embedded AI assistant (`AIMitra.tsx` & `/api/ai-mitra`) provides contextual guidance on dairy management, animal health, and milk quality.

```
┌────────────────────────────────────────────────────────┐
│  🤖 AI Krishi Mitra (कृषी मित्र)                        │
│  Farmer: Ramesh Patil · Avg FAT: 4.6% · SNF: 8.8%      │
├────────────────────────────────────────────────────────┤
│  Farmer: "माझ्या गायीचे फॅट कसे वाढवायचे?"             │
│                                                        │
│  AI Mitra: "नमस्ते रमेश जी! तुमच्या सध्याच्या दुधाचे  │
│  सरासरी फॅट ४.६% आहे. फॅट ५.०% पर्यंत वाढवण्यासाठी:   │
│  १. आहारात सुका चारा आणि हिरवा चारा यांचे योग्य प्रमाण ठेवा.│
│  २. सरकी पेंड (Cottonseed cake) आणि खनिज मिश्रण द्या.  │
│  ३. पाणी स्वच्छ व मुबलक प्रमाणात उपलब्ध करा."         │
├────────────────────────────────────────────────────────┤
│  [🎙️ Voice Record]  [💬 Type in Hindi/Marathi/English] │
└────────────────────────────────────────────────────────┘
```

### Capabilities
- **Context Injection**: The AI prompt includes the farmer's real-time average FAT, SNF, total volume, and recent earnings, enabling personalized recommendations.
- **Multilingual Support**: Processes and responds fluently in **Hindi, Marathi, and English**.
- **Topic Coverage**:
  - Feed and nutrition optimization to improve butterfat content.
  - Mastitis prevention and hygienic milking protocols.
  - Lactation cycle management and cattle disease identification.
  - Clarification of rate calculations and payment transaction details.

---

## 8. Digital Collection Center POS Terminal (`/branch/[branchId]`)

The center-level POS interface for operators receiving daily milk deliveries.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 3T Center POS Terminal — Branch B-01 (Pune Central)                    │
│ Active Shift: ☀️ MORNING   Formula: Base ₹15 | F×5.5 | S×2             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Select Farmer: [ F-101 | Ramesh Patil — 9876543210        ▾ ]       │
│ 2. Milk Weight:   [ 12.50 ] Liters                                     │
│ 3. FAT %:         [ 4.50  ] %                                          │
│ 4. SNF %:         [ 8.70  ] %                                          │
├────────────────────────────────────────────────────────────────────────┤
│ Calculated Rate: ₹ 57.15 / Liter       Total Payout: ₹ 714.38          │
│                                                                        │
│ [ 🚀 DISPATCH MILK & INSTANT UPI SETTLEMENT ]                          │
├────────────────────────────────────────────────────────────────────────┤
│ [Thermal Slip Print]  [Broadcast Realtime Sync]  [Auto-Clear Form]     │
└────────────────────────────────────────────────────────────────────────┘
```

### Operational Workflow
1. **Shift Selection**: One-tap toggle between **Morning** and **Evening** collection shifts.
2. **Farmer Auto-Lookup**: Search by ID, full name, or phone number. Displays linked banking verification status.
3. **Automated Rate Computation**: Live calculation of rate per liter and gross payout as weight, FAT, and SNF are entered.
4. **Instant UPI Settlement Dispatch**:
   - Writes collection record to `collections`.
   - Generates and writes payment record to `payments` with a unique transaction UTR.
   - Triggers cross-tab broadcast update (`BroadcastChannel`) to all connected devices.
   - Generates printable collection slips for center records.

---

## 9. Master Admin & Operations Dashboard (`/dashboard`)

The central administrative hub for dairy management, accounting, and system configuration.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  3T Master Operations Dashboard                               [Role: Admin 👑]   │
├────────────────┬─────────────────────────────────────────────────────────────────┤
│ 📊 Overview    │ Total Milk Intake: 18,420.5 L      Total Disbursed: ₹ 9,84,210  │
│ 👥 Farmers     │ Today's Collection: 1,420.0 L      Active Farmers: 48 Registered │
│ 🥛 Collections │ Average Center FAT: 4.52%          Average Center SNF: 8.68%    │
│ 💳 Payments    ├─────────────────────────────────────────────────────────────────┤
│ 🏢 Branches    │ Recent Live Pourings (Auto-refreshing)                          │
│ 📈 Analytics   │ • F-101 | Ramesh Patil | 12.5 L | ₹714.38 | ☀️ Morning [PAID]  │
│ 📑 Reports     │ • F-104 | Suresh Shinde | 8.2 L | ₹468.10 | ☀️ Morning [PAID]  │
│ ⚙️ Settings    │ • F-102 | Sunita Deshmukh|15.0 L | ₹842.20 | ☀️ Morning [PAID]  │
│ 📢 Broadcast   │                                                                 │
└────────────────┴─────────────────────────────────────────────────────────────────┘
```

### Dashboard Tabs

```
├── 📊 Overview       -> Real-time KPIs, daily milk intake volume, financial outflow, live feed
├── 👥 Farmers        -> Farmer catalog, KYC registration, profile editing, drawer inspector
├── 🥛 Collections    -> Historical delivery ledger, shift filtering, volume summaries
├── 💳 Payments       -> Instant UPI settlement monitor, Razorpay gateway triggers, UTR logs
├── 🏢 Branches       -> Collection center network monitor, hardware configurations
├── 📈 Analytics      -> Quality heatmaps, FAT/SNF distribution curves, daily trends
├── 📑 Reports        -> Audited financial statements, bank settlement exports, CSV downloads
├── ⚙️ Settings       -> Pricing formula manager (Base, FAT factor, SNF factor), system config
└── 📢 Broadcast      -> Push notifications & emergency broadcast announcements
```

#### Detailed Tab Breakdown

### 1. Overview Tab
- **KPI Metrics Cards**: Total milk intake (Liters), today's collections, total UPI payout disbursals (₹), and active registered farmers.
- **Quality Indicators**: Real-time average FAT% and SNF% across all active centers.
- **Live Pouring Feed**: Chronological list of milk deliveries with instant status indicators.

### 2. Farmers Directory & Master Catalog Tab
- **Responsive Presentation**:
  - **Desktop View**: Multi-column table with sorting, direct passbook links, KYC inspection, and profile editing.
  - **Mobile View**: Dedicated **Farmer Cards** displaying name, village, cattle count, volume metrics, total earnings, tap-to-call, and quick-action buttons.
- **Farmer KYC Registration Modal**:
  - Collects Full Name, Phone Number, Village, Cattle Count, Aadhaar Number, Bank Account Number, IFSC Code, and UPI ID.
  - Generates a unique Farmer ID (e.g., `F-108`) and provisions a personalized Digital Passbook.
- **Farmer Drawer Inspector**: Slide-over drawer displaying comprehensive lifetime stats, payment history, and verified banking data.
- **Master CSV Export**: Exports complete farmer ledgers to CSV format with a single click.

### 3. Collections Tab
- Complete searchable ledger of all milk collections across all centers.
- Filter by Center ID, Date Range, Farmer ID, or Shift.
- Exports filtered records for cooperative audits.

### 4. Payments Tab
- Tracks instant payment settlement lifecycles.
- Displays transaction UTRs, execution timestamps, bank settlement paths, and status badges (`Settled`, `Processing`, `Failed`).
- Integration with Razorpay Payment Gateway for automated and manual payout processing.

### 5. Branches Tab
- Monitors collection centers (`B-01` Pune, `B-02` Baramati, `B-03` Kolhapur, `B-04` Sangli).
- Displays daily intake volumes, center operator contact details, and hardware status.

### 6. Analytics & Quality Trends Tab
- **Volume Trajectory Charts**: Compares morning vs. evening collection volumes across weekly and monthly periods.
- **Quality Heatmaps**: Visualizes FAT and SNF distributions to help identify cattle feed deficiencies by village.
- **Financial Outflow Analytics**: Forecasts cash reserve requirements based on intake patterns.

### 7. Reports & Auditing Tab
- Generates periodic reconciliation statements.
- Prepares bank-formatted payout sheets for financial institution compliance.

### 8. Settings & Pricing Formula Tab
- Modifies Base Price, FAT Factor, and SNF Factor in real time.
- Changes update the global pricing engine immediately without server restarts.

### 9. Emergency Broadcast Tab (`BroadcastTab.tsx`)
- Allows administrators to send mass announcements to all registered farmers via SMS or notification panels.
- Pre-configured templates for weather alerts, bonus payouts, rate revisions, and holiday schedules.

---

## 10. Public Solution & Corporate Pages

The application includes informational pages detailing the platform's features for different stakeholders.

```
┌────────────────────────────────────────────────────────┐
│                   Public Site Map                      │
├────────────────────────────────────────────────────────┤
│  /                     Landing Page (ROI Calculator)   │
│  /about                Company Vision & Leadership     │
│  /mission              Core Objectives & Roadmap       │
│  /careers              Job Openings & Culture          │
│  /press-kit            Brand Assets & Press Releases   │
│  /solutions/farmers    Farmer Passbook Features        │
│  /solutions/dairies    Dairy Automation & ERP Sync     │
│  /solutions/digital-weighing  Hardware Integrations    │
│  /solutions/bank-integrations FinTech & Direct UPI     │
│  /legal/terms          Terms of Service                │
│  /legal/privacy        Data Privacy Policy             │
│  /legal/security       Financial Security & Encryption │
│  /legal/compliance     Regulatory Guidelines           │
└────────────────────────────────────────────────────────┘
```

### Public Page Highlights
- **Interactive Landing Page (`/`)**: Features an interactive **Milk Rate Simulator** and **Farmer ROI Calculator**, illustrating potential earning gains from transparent quality pricing.
- **Hardware Integration Page (`/solutions/digital-weighing`)**: Explains RS232/USB serial weighing scale protocols and automated ultrasonic milk analyzer integrations.
- **Fintech Integration Page (`/solutions/bank-integrations`)**: Documents NPCI UPI stack integration, automated e-mandates, and instant settlement pipelines.

---

## 11. Security, Proxy Middleware & Enterprise Compliance

```
┌────────────────────────────────────────────────────────┐
│            Next.js 16 Proxy Middleware                 │
│                   (src/proxy.ts)                       │
├────────────────────────────────────────────────────────┤
│ 1. Public Route Whitelist Inspection                   │
│    (/, /login, /farmer/login, /manifest.json, /sw.js)  │
│ 2. Role-Based Access Control (RBAC)                    │
│    Verifies JWT tokens (Admin vs Staff vs Farmer)      │
│ 3. Security Header Injection:                          │
│    • Content-Security-Policy (CSP)                     │
│    • Strict-Transport-Security (HSTS Preload)          │
│    • X-Frame-Options: DENY                             │
│    • X-Content-Type-Options: nosniff                   │
│    • Permissions-Policy (Camera, Mic restricted)       │
└────────────────────────────────────────────────────────┘
```

### Security Architecture

#### 1. Route Protection & RBAC
- Unauthenticated requests to administrative endpoints (`/dashboard`, `/api/admin/*`, `/api/settings`) are blocked and redirected to `/login`.
- Staff accounts are restricted from accessing sensitive banking data (Aadhaar numbers, bank accounts) via role checks.
- Farmer tokens (`3t_farmer_token`) grant read access exclusively to their own ledger records (`/farmer/[farmerId]`).

#### 2. Enterprise HTTP Security Headers
- **Content-Security-Policy (CSP)**: Restricts script execution to approved domains (Razorpay, Supabase, Google Fonts).
- **HSTS (Strict-Transport-Security)**: Enforces HTTPS connections (`max-age=31536000; includeSubDomains; preload`).
- **X-Frame-Options**: Set to `DENY` to prevent clickjacking attacks.
- **X-Content-Type-Options**: Set to `nosniff` to prevent MIME-type sniffing.

---

## 12. Complete Technical Specifications Matrix

| Module | Route / File | Core Tech & Libraries | Primary Functionality |
| :--- | :--- | :--- | :--- |
| **PWA Manifest** | `src/app/api/manifest/route.ts` | Next.js API, JSON | Dynamic manifest generation with farmer-specific naming and routing. |
| **Service Worker** | `public/sw.js` | Service Worker API | Caches shell assets and enables browser PWA installation. |
| **Passbook Actions**| `src/app/farmer/[farmerId]/PassbookHeaderActions.tsx`| React, Lucide Icons | Handles `beforeinstallprompt`, PWA installation, and print actions. |
| **Passbook Ledger** | `src/app/farmer/[farmerId]/LivePassbookLedger.tsx` | React, BroadcastChannel | Real-time ledger with search, 10-day cycle filters, and summary cards. |
| **Farmer Passbook** | `src/app/farmer/[farmerId]/page.tsx` | Server Components, Supabase | Server-rendered passbook shell with metadata and session verification. |
| **Farmer Auth** | `src/app/farmer/login/page.tsx` | React, Framer Motion | Passwordless 10-digit mobile login with auto-focused OTP entry. |
| **AI Krishi Mitra** | `src/app/farmer/[farmerId]/AIMitra.tsx` | React, Speech API | Context-aware multilingual AI assistant (Hindi, Marathi, English). |
| **Database Engine** | `src/lib/db.ts` | LowDB, Supabase JS | Dual-layer persistence engine with in-memory caching and cloud backups. |
| **Proxy Middleware**| `src/proxy.ts` | Next.js Middleware, JWT | Route protection, RBAC validation, and security header injection. |
| **Center POS** | `src/app/branch/[branchId]/page.tsx`| React, Lucide Icons | Operator terminal for milk intake, quality pricing, and UPI triggers. |
| **Admin Dashboard** | `src/app/dashboard/page.tsx` | React, Tailwind CSS | Management dashboard for farmer KYC, payments, analytics, and formula settings. |

---

## 13. Summary of End-to-End User Journeys

### Journey 1: The Dairy Farmer
1. **Morning Delivery**: Farmer brings milk to the local collection center.
2. **Instant Settlement**: Milk is weighed and tested; quality parameters are entered into the terminal.
3. **Passbook Update**: Farmer receives payment via UPI, and their Digital Passbook updates within 10 seconds.
4. **10-Day Audit**: Farmer opens the passbook on their phone, selects the current 10-day cycle, and reviews net volume, average FAT/SNF, and total earnings.
5. **AI Consultation**: Farmer asks AI Krishi Mitra in Marathi or Hindi for advice on optimizing cattle feed for better butterfat yield.

### Journey 2: The Collection Center Operator
1. **Terminal Setup**: Operator opens `/branch/B-01` and selects the morning shift.
2. **Intake Processing**: Operator searches for the farmer by ID or name, inputs weight, FAT%, and SNF%.
3. **Dispatch**: Clicks *Dispatch Milk & Instant UPI Settlement*.
4. **Receipt**: Prints the collection receipt for center records while payment processes automatically in the background.

### Journey 3: The Dairy Administrator
1. **Dashboard Monitoring**: Tracks milk intake volumes, center quality averages, and payment disbursals in real time.
2. **Pricing Configuration**: Updates FAT or SNF factors in the settings tab to respond to market conditions.
3. **KYC Registration**: Registers new farmers, assigning IDs and configuring bank/UPI accounts for instant settlement.
4. **Financial Reconciliation**: Exports 10-day audit CSV files for bank partners and accounting systems.

---

*This document serves as the complete functional and technical specification for the 3T (Time To Time) Dairy Financial Ecosystem.*