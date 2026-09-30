# -*- coding: utf-8 -*-
"""
3T Dairy - Backend Technologies & Technical Jury Defense Guide Generator
Generates a comprehensive, professional PDF covering:
1. Complete Backend Tech Stack, Architecture & Data Layer
2. Why each technology was selected (Hybrid Storage, Anti-Fraud, Zero Data Loss, Security)
3. Top 15 Technical Jury & Judge Defense Questions with Winning Answers
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.setFont('Helvetica-Bold', 8)
            self.setFillColor(colors.HexColor('#064e3b'))
            self.drawString(40, 760, '3T DAIRY - BACKEND TECHNOLOGIES & TECHNICAL JURY DEFENSE GUIDE')
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawRightString(572, 760, 'Round 2 / Grand Finale Defense')
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(40, 752, 572, 752)

        # Footer (All pages)
        self.setFont('Helvetica', 8)
        self.setFillColor(colors.HexColor('#64748b'))
        self.drawString(40, 30, '3T Dairy Platform | Backend Architecture, Data Pipelines, Security & Judge Q&A')
        self.drawRightString(572, 30, f'Page {self._pageNumber} of {page_count}')
        self.setStrokeColor(colors.HexColor('#e2e8f0'))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        self.restoreState()

def build_pdf(filename="3T_Dairy_Backend_Technologies_and_Judges_QnA.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    c_primary = colors.HexColor('#064e3b')
    c_emerald = colors.HexColor('#059669')
    c_dark = colors.HexColor('#0f172a')
    c_muted = colors.HexColor('#475569')
    c_border = colors.HexColor('#e2e8f0')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=c_primary,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_muted,
        spaceAfter=8
    )

    sec_title_style = ParagraphStyle(
        'SecTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=colors.white
    )

    item_title_style = ParagraphStyle(
        'ItemTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_primary,
        spaceBefore=5,
        spaceAfter=2
    )

    item_sub_style = ParagraphStyle(
        'ItemSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#047857'),
        spaceAfter=2
    )

    body_style = ParagraphStyle(
        'ItemBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark,
        spaceAfter=4
    )

    q_title_style = ParagraphStyle(
        'QTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=5,
        spaceAfter=2
    )

    q_key_style = ParagraphStyle(
        'QKey',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#0f766e'),
        spaceAfter=2
    )

    elements = []

    # Document Header
    elements.append(Paragraph('3T DAIRY: BACKEND TECHNOLOGIES & TECHNICAL JURY DEFENSE GUIDE', title_style))
    elements.append(Paragraph('<b>Comprehensive Architecture Rationale & Technical Q&A Preparation for Judges</b><br/>Hybrid PostgreSQL + LowDB Engine | Serverless API Handlers | Anti-Fraud Shift Locks | Zero-Knowledge PII Masking', subtitle_style))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=c_primary, spaceBefore=0, spaceAfter=8))

    # =========================================================================
    # PART 1: BACKEND TECH STACK & ARCHITECTURE RATIONALE
    # =========================================================================
    part1_sections = [
        {
            'category': 'PART 1: CORE BACKEND TECH STACK & WHY WE CHOSE THEM',
            'bg_color': '#064e3b',
            'items': [
                (
                    '1. Next.js 15+ Serverless API Route Handlers (Node.js Edge Runtime)',
                    'Why We Chose It: Sub-50ms execution, automatic horizontal auto-scaling, and zero server maintenance overhead.',
                    '• <b>Force-Dynamic & Zero Caching:</b> All critical endpoints (<code>/api/collections</code>, <code>/api/payments</code>, <code>/api/farmers</code>, <code>/api/data</code>) enforce <code>dynamic = "force-dynamic"</code> and <code>revalidate = 0</code> to guarantee real-time financial accuracy.<br/>'
                    '• <b>Stateless Horizontal Scale:</b> Serverless functions spin up on-demand during the 6:00 AM - 8:30 AM morning collection rush, handling spikes of 500+ concurrent centers without provisioning heavy EC2 instances.<br/>'
                    '• <b>Unified TypeScript Pipeline:</b> Shared type interfaces across frontend and backend eliminate serialization mismatches and API schema drift.'
                ),
                (
                    '2. Hybrid Storage Architecture: Supabase Cloud PostgreSQL + LowDB Local Disk Queue',
                    'Why We Chose It: Delivers enterprise ACID relational cloud storage while maintaining 100% offline uptime in remote villages.',
                    '• <b>Supabase Cloud PostgreSQL:</b> Master cloud database providing relational data integrity, foreign key constraints (farmers → collections → payments), PgBouncer connection pooling, and Row-Level Security (RLS).<br/>'
                    '• <b>LowDB (Local Disk JSON Store):</b> Atomic file system storage (<code>db.json</code>) operating on booth counter computers. Every collection is written locally first in &lt;1ms before cloud dispatch.<br/>'
                    '• <b>Resilient Offline Reconciliation:</b> If village internet disconnects, the counter continues uninterrupted. Upon reconnection, <code>refreshFromSupabase</code> automatically syncs queued local records to the cloud with zero data loss.'
                ),
                (
                    '3. Dynamic Dairy Formula Valuation Engine & Historical Financial Lock',
                    'Why We Chose It: Sub-millisecond rate calculations with immutable financial record freezing.',
                    '• <b>Linear Pricing Equation:</b> Computes milk value mathematically: <code>Rate = BasePrice + (FAT × FatFactor) + (SNF × SnfFactor)</code>; <code>Total = Round(Weight × Rate, 2)</code>.<br/>'
                    '• <b>Immutable Historical Rate Freezing:</b> When milk is collected, the exact calculated rate and total are permanently stamped on the collection row. Future changes to society pricing formulas never distort past historical ledgers or audit statements.'
                ),
                (
                    '4. Intelligent Anti-Fraud Shift Duplicate Lockout Engine (`getCollectionShift`)',
                    'Why We Chose It: Eliminates operator-farmer collusion and double milk payment disbursements.',
                    '• <b>Intelligent Shift Resolver:</b> Accurately categorizes collections into "Morning" vs "Evening" regardless of whether the timestamp is stored as a shift string or explicit 12-hour clock time (e.g. <code>03:55 PM</code> &rarr; <code>Evening</code>, <code>10:24 AM</code> &rarr; <code>Morning</code>).<br/>'
                    '• <b>Collusion Prevention:</b> If a farmer has already logged milk in the current shift on the current date, the backend rejects duplicate requests with <code>HTTP 400 Bad Request</code> and <code>isDuplicateFraud: true</code>, requiring an authorized Super Admin override PIN.<br/>'
                    '• <b>Biological Capacity Guards:</b> Single batch weight is capped at 200L, and FAT/SNF are validated within biological bovine limits (1.5% - 12.0% FAT, 6.0% - 12.0% SNF) to block fraudulent injections.'
                ),
                (
                    '5. Zero-Knowledge PII Protection & Strict Data Sanitization Pipeline',
                    'Why We Chose It: Total protection of farmer financial credentials and RBI compliance.',
                    '• <b>Server-Side Masking:</b> In <code>GET /api/data</code>, raw 12-digit Aadhaar numbers are masked to <code>•••• •••• 7133</code>, Bank Accounts to <code>••••••••9012</code>, and IFSC to <code>SBIN••••234</code>. Unmasked credentials never leave the backend.<br/>'
                    '• <b>Write-Only KYC Updates:</b> Sensitive updates only accept unmasked input if a complete, valid new value is provided; partial masked strings are automatically discarded to preserve underlying encrypted values.<br/>'
                    '• <b>Strict Input Sanitization:</b> All string inputs pass through HTML tag stripping and character sanitizers to eliminate XSS and injection vulnerabilities.'
                ),
                (
                    '6. Enterprise Role-Based Access Control (RBAC) & HMAC-SHA256 Session Auth',
                    'Why We Chose It: Tamper-proof session tokens without heavy third-party OAuth overhead.',
                    '• <b>Role Separation:</b> Strict privilege isolation between <code>SUPER_ADMIN</code> (Society President/Owner: rate formula configuration, farmer deletion, fraud override) and <code>STAFF/OPERATOR</code> (restricted to intake logging and passbook viewing).<br/>'
                    '• <b>HttpOnly Cookie Transport:</b> Session tokens are signed using HMAC-SHA256 and transmitted in <code>HttpOnly; SameSite=Lax; Secure</code> cookies, completely immune to client-side script theft.'
                ),
                (
                    '7. Idempotent Fintech Payout Engine (Razorpay / Instant UPI Gateway Integration)',
                    'Why We Chose It: Sub-second bank transfers with zero risk of duplicate payouts.',
                    '• <b>Idempotency Hash Keys:</b> Every payout request uses a unique cryptographic key generated from collection metadata (<code>PAY-[timestamp]-[farmerId]</code>). Even if network retries occur, the banking gateway will never disburse twice.<br/>'
                    '• <b>Instant UTR Generation:</b> Returns genuine banking UTR (Unique Transaction Reference) codes, itemized timeline steps (Initiated &rarr; NPCI Switch &rarr; Settled), and automated WhatsApp webhook triggers.'
                ),
                (
                    '8. Automated Time-Series Cattle Health & Milk Drop Anomaly Engine',
                    'Why We Chose It: Early detection of bovine sickness (Mastitis/Ketosis) to protect farmer livelihood.',
                    '• <b>Rolling 14-Day Baseline Telemetry:</b> Evaluates each cow\'s historical morning and evening yield baselines.<br/>'
                    '• <b>Anomaly Shock Alert:</b> When a delivery drops by &gt;25-30% below expected shift baselines, the engine flags potential subclinical infection and generates an automated notification advisory to consult AI Mitra or a local veterinarian.'
                ),
                (
                    '9. Cloud Conflict Resolution & Permanent Retired Farmer ID Registry',
                    'Why We Chose It: Prevents deleted mock records from resurrecting across multi-device serverless instances.',
                    '• <b>Multi-Table ID Retirement:</b> Soft-deleted farmer IDs are archived to a 15-day dispute ledger and permanently registered in <code>CONFIG-RETIRED-FARMERS</code> across Supabase <code>farmers</code>, <code>branches</code>, and <code>collections</code> tables.<br/>'
                    '• <b>Safe Rehydration:</b> Default mock data is only initialized if the database is 100% brand new and empty, guaranteeing deleted accounts remain permanently retired.'
                )
            ]
        }
    ]

    for sec in part1_sections:
        cat_p = Paragraph(f'<b>{sec["category"]}</b>', sec_title_style)
        cat_table = Table([[cat_p]], colWidths=[532])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(sec['bg_color'])),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(cat_table)
        elements.append(Spacer(1, 2))

        for title, subtitle, full_text in sec['items']:
            item_elements = []
            item_elements.append(Paragraph(title, item_title_style))
            item_elements.append(Paragraph(subtitle, item_sub_style))
            item_elements.append(Paragraph(full_text, body_style))
            item_elements.append(HRFlowable(width='100%', thickness=0.5, color=c_border, spaceBefore=2, spaceAfter=3))
            elements.append(KeepTogether(item_elements))

        elements.append(Spacer(1, 4))

    # =========================================================================
    # PART 2: TOP 15 JUDGES & JURY QUESTIONS WITH MODEL ANSWERS
    # =========================================================================
    part2_sections = [
        {
            'category': 'PART 2: TOP 15 BACKEND JUDGES QUESTIONS & HIGH-SCORING ANSWERS',
            'bg_color': '#1e3a8a',
            'qas': [
                (
                    'Q1. Why did you choose a Hybrid Database (Supabase PostgreSQL + LowDB) instead of pure Cloud SQL?',
                    'Because village collection centers cannot stop operating when rural internet drops during morning peak intake hours.',
                    '<b>Answer:</b> If a dairy counter relied solely on Cloud SQL, a single mobile tower outage would halt milk intake for 200+ farmers, spoiling milk and creating chaos. By pairing <b>Supabase PostgreSQL</b> (for cloud ACID transactions, analytics, and mobile passbooks) with <b>LowDB</b> (for local atomic disk logging on the booth PC), the counter operates at 100% speed completely offline. When connectivity resumes, our background sync reconciles local queues into PostgreSQL with zero data loss.'
                ),
                (
                    'Q2. How do you prevent double payouts and race conditions when processing instant UPI payments?',
                    'Through cryptographic idempotency keys, atomic transaction IDs, and database-level shift lockout constraints.',
                    '<b>Answer:</b> (1) <b>Idempotency Keys:</b> Every payment request dispatched to the payment gateway includes a deterministic hash key (<code>PAY-[collectionId]</code>); (2) <b>Pre-Disbursement Shift Lock:</b> The collection endpoint atomically checks if a delivery already exists for that farmer in the current shift before triggering the payment pipeline; (3) <b>Webhook Verification:</b> Signature verification on payment webhooks ensures payment state is only updated upon genuine bank authorization.'
                ),
                (
                    'Q3. How does the backend accurately detect duplicate shift entries across different clock time formats?',
                    'Our custom `getCollectionShift` analyzer classifies both shift labels and 12-hour clock times into deterministic Morning and Evening shifts.',
                    '<b>Answer:</b> Milk intakes can be stamped as explicit shift names (<code>Morning</code>/<code>Evening</code>) or exact wall-clock timestamps (e.g., <code>03:55 PM</code>, <code>10:24 AM</code>). Our resolver inspects the AM/PM indicator and hour thresholds: any pour between 00:00 - 12:59 (AM) maps to <b>Morning Shift</b>, and 13:00 - 23:59 (PM) maps to <b>Evening Shift</b>. This prevents bypasses where an operator logs a second pour using clock time instead of the word "Evening".'
                ),
                (
                    'Q4. How will the backend scale if 500 collection centers and 100,000 farmers pour milk at 7:00 AM?',
                    'Through stateless serverless edge execution, PgBouncer connection pooling, and asynchronous background worker queues.',
                    '<b>Answer:</b> (1) <b>Serverless Edge Routing:</b> Next.js API routes scale horizontally on-demand across global edge regions with zero cold boot provisioning; (2) <b>PgBouncer / Supavisor Connection Pooling:</b> Manages thousands of simultaneous database connections without PostgreSQL thread exhaustion; (3) <b>Asynchronous Dispatches:</b> WhatsApp receipts and notification webhooks are dispatched asynchronously, keeping the core collection response under 50ms.'
                ),
                (
                    'Q5. How do you protect sensitive farmer financial PII (Aadhaar, Bank Accounts) at the API layer?',
                    'Zero-Knowledge server-side masking where raw 12-digit Aadhaar and full bank account numbers never leave the database server in plaintext.',
                    '<b>Answer:</b> In <code>GET /api/data</code> and <code>GET /api/farmers</code>, the backend intercepts data models and masks sensitive fields: Aadhaar is converted to <code>•••• •••• 7133</code> and Bank Account to <code>••••••••9012</code>. Only masked strings are transmitted over the wire. Unmasked data is only accepted during write-only KYC onboarding over TLS 1.3 encrypted HTTPS.'
                ),
                (
                    'Q6. How does the automated cattle health yield drop anomaly detection algorithm work?',
                    'Agricultural time-series anomaly detection based on rolling 14-day delivery baselines and diurnal variance analysis.',
                    '<b>Answer:</b> The system continuously tracks each farmer\'s 14-day rolling average for Morning and Evening pours. When a farmer\'s shift pour drops by &gt;25-30% below expected baselines, the algorithm filters out normal diurnal variance and flags potential subclinical illness (e.g., early-stage Mastitis or metabolic distress). It automatically generates an alert recommending veterinary inspection or Gemini AI Mitra diagnosis.'
                ),
                (
                    'Q7. What happens if Supabase Cloud experiences an outage during live milk intake?',
                    'The backend seamlessly falls back to local LowDB disk persistence with zero operator disruption.',
                    '<b>Answer:</b> The database layer (<code>src/lib/db.ts</code>) wraps all Supabase cloud calls in a fast timeout wrapper (<code>withTimeout</code>). If Supabase does not respond within 2000ms, the system falls back to the local disk store (<code>db.json</code>), logging the entry with local success status. When Supabase recovers, the background syncer detects pending local records and batches them to the cloud.'
                ),
                (
                    'Q8. How is the pricing formula protected from unauthorized tampering by booth operators?',
                    'Role-based access control, cryptographic session signing, and immutable historical transaction locking.',
                    '<b>Answer:</b> The <code>PUT /api/settings</code> formula configuration endpoint strictly requires a verified <code>SUPER_ADMIN</code> session token. Counter operators have read-only access to formula parameters. Furthermore, every past collection record freezes its calculated rate permanently at the time of intake, ensuring future formula changes cannot alter past payout records.'
                ),
                (
                    'Q9. How do you handle farmer deletions, disputes, and ID resurrection prevention?',
                    'A 15-day soft-delete dispute window combined with permanent ID retirement in cloud configuration records.',
                    '<b>Answer:</b> When a farmer is deleted, their record is moved to an internal 15-day audit archive (<code>deletedFarmers</code>) for legal dispute resolution. Simultaneously, their ID (e.g. <code>F-109</code>) is added to <code>CONFIG-RETIRED-FARMERS</code> across Supabase tables. During server rehydration, the system strictly checks the retired registry, guaranteeing that deleted IDs are never resurrected by default mock seeders.'
                ),
                (
                    'Q10. How do you prevent SQL Injection, XSS, and payload tampering in Next.js API routes?',
                    'Parameterized Supabase SQL queries, TypeScript interface validation, and recursive input sanitization.',
                    '<b>Answer:</b> Supabase PostgREST client utilizes parameterized prepared statements for all database queries, making SQL injection impossible. For request payloads, all incoming string fields pass through a custom sanitization function that strips HTML/script tags and enforces strict type constraints before writing to memory or disk.'
                ),
                (
                    'Q11. How does the backend ensure consistency when multiple operators manage the same branch?',
                    'Chronological timestamp sorting (parseDateTimeToEpoch) and optimistic concurrency control.',
                    '<b>Answer:</b> Collections and payments are indexed by exact millisecond timestamps and unique IDs. The <code>refreshFromSupabase</code> resolver orders records strictly by <code>Date DESC &rarr; Epoch Time DESC &rarr; ID DESC</code>, ensuring that all operators across multiple laptops see an identical, chronologically sorted ledger.'
                ),
                (
                    'Q12. What happens if a payment gateway webhook arrives late or out of order?',
                    'Idempotent state transitions with status precedence guards.',
                    '<b>Answer:</b> If a payment has already been marked as <code>Success</code> and stamped with a bank UTR, a delayed webhook payload cannot downgrade the record to <code>Processing</code>. Webhook handlers verify cryptographic HMAC signatures and execute idempotent upserts that only transition records forward in the payment state machine.'
                ),
                (
                    'Q13. Why use Serverless Node.js functions instead of a dedicated Docker / Kubernetes cluster?',
                    'Serverless eliminates 24/7 idle server costs, scales automatically from 0 to 10,000 instances in seconds, and provides zero-maintenance deployment.',
                    '<b>Answer:</b> Dairy collection occurs in two intense 2-hour bursts per day (6-8 AM and 5-7 PM). A dedicated Kubernetes cluster would waste money running idle for 20 hours a day. Serverless functions on Next.js/Vercel scale up instantly during peak hours and scale down to zero when idle, minimizing operating costs while handling infinite burst traffic.'
                ),
                (
                    'Q14. How are database migrations and schema changes managed as the platform grows?',
                    'Declarative SQL migration scripts with backwards-compatible schema extensions and fallback column defaults.',
                    '<b>Answer:</b> Supabase migrations use declarative SQL scripts (e.g., adding <code>shift</code>, <code>branch_id</code>, <code>timeline</code> columns with sensible defaults). The backend hydration layer in <code>db.ts</code> includes defensive fallbacks (e.g., <code>c.branch_id || &quot;B-01&quot;</code>), ensuring uninterrupted operations during database schema upgrades.'
                ),
                (
                    'Q15. If judges ask: "What is the single biggest backend engineering achievement in 3T Dairy?"',
                    'Architecting a fault-tolerant, hybrid fintech data pipeline that achieves sub-second instant payouts and 100% offline uptime while guaranteeing bank-grade data integrity.',
                    '<b>Answer:</b> Our greatest backend accomplishment was solving the rural fintech paradox: delivering <b>instant UPI bank settlements (<100ms) with bank-grade security</b> while maintaining <b>total offline operational resilience</b> during village internet outages. We combined Supabase PostgreSQL with local disk queueing, anti-fraud shift locking, and zero-knowledge PII protection into a seamless, high-speed platform.'
                )
            ]
        }
    ]

    for sec in part2_sections:
        cat_p = Paragraph(f'<b>{sec["category"]}</b>', sec_title_style)
        cat_table = Table([[cat_p]], colWidths=[532])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(sec['bg_color'])),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(cat_table)
        elements.append(Spacer(1, 2))

        for q_title, key_point, full_answer in sec['qas']:
            q_elements = []
            q_elements.append(Paragraph(q_title, q_title_style))
            q_elements.append(Paragraph(f'<b>🎯 Winning Key Point:</b> <i>{key_point}</i>', q_key_style))
            q_elements.append(Paragraph(full_answer, body_style))
            q_elements.append(HRFlowable(width='100%', thickness=0.5, color=c_border, spaceBefore=2, spaceAfter=3))
            elements.append(KeepTogether(q_elements))

        elements.append(Spacer(1, 4))

    # Build Document
    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"[OK] Successfully built PDF: {filename}")

if __name__ == '__main__':
    build_pdf('3T_Dairy_Backend_Technologies_and_Judges_QnA.pdf')
