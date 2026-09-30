# -*- coding: utf-8 -*-
"""
3T Dairy - Frontend Technologies & Technical Jury Defense Guide Generator
Generates a comprehensive, professional PDF covering:
1. Complete Frontend Tech Stack & Architecture
2. Why each technology was selected (Performance, Rural Usability, Security)
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
            self.drawString(40, 760, '3T DAIRY - FRONTEND TECHNOLOGIES & TECHNICAL JURY DEFENSE GUIDE')
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawRightString(572, 760, 'Round 2 / Grand Finale Defense')
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(40, 752, 572, 752)

        # Footer (All pages)
        self.setFont('Helvetica', 8)
        self.setFillColor(colors.HexColor('#64748b'))
        self.drawString(40, 30, '3T Dairy Platform | Frontend Architecture, Design Rationales & Judge Q&A')
        self.drawRightString(572, 30, f'Page {self._pageNumber} of {page_count}')
        self.setStrokeColor(colors.HexColor('#e2e8f0'))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        self.restoreState()

def build_pdf(filename="3T_Dairy_Frontend_Technologies_and_Judges_QnA.pdf"):
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
    elements.append(Paragraph('3T DAIRY: FRONTEND TECHNOLOGIES & TECHNICAL JURY DEFENSE GUIDE', title_style))
    elements.append(Paragraph('<b>Comprehensive Architecture Rationale & Technical Q&A Preparation for Judges</b><br/>Next.js 15 App Router | React 19 | TypeScript | Tailwind CSS | PWA Offline Engine | Realtime Inter-Tab Sync', subtitle_style))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=c_primary, spaceBefore=0, spaceAfter=8))

    # =========================================================================
    # PART 1: FRONTEND TECH STACK & ARCHITECTURE RATIONALE
    # =========================================================================
    part1_sections = [
        {
            'category': 'PART 1: CORE FRONTEND TECH STACK & WHY WE CHOSE THEM',
            'bg_color': '#064e3b',
            'items': [
                (
                    '1. Next.js 15+ (App Router & Server/Client Hybrid Architecture)',
                    'Why We Chose It: Sub-second initial load, unified full-stack architecture, and zero cold-start API routes.',
                    '• <b>Server Components (RSC) & Streaming:</b> Renders initial static layouts on the server, resulting in sub-300ms First Contentful Paint (FCP) even on rural 3G/4G networks.<br/>'
                    '• <b>App Router Segmenting:</b> Clean separation of route groups: <code>/dashboard</code> (Admin/Operator Console), <code>/branch/[branchId]</code> (Booth Terminal POS), <code>/farmer/[farmerId]</code> (Public PWA Passbook), and <code>/api/*</code> (Fintech & Hardware endpoints).<br/>'
                    '• <b>No Separate Backend Required:</b> Serverless Next.js route handlers handle dynamic FAT/SNF formula recalculation, Razorpay webhook verification, and Supabase cloud synchronization in a single high-performance codebase.'
                ),
                (
                    '2. React 19 & Advanced Custom Hooks State Engine',
                    'Why We Chose It: High-frequency hardware stream reactivity without UI blocking or frame drops.',
                    '• <b>High-Speed Memory Memoization:</b> Uses <code>useMemo</code> and <code>useCallback</code> to precompute rate matrix calculations (<code>Rate = Base + FAT*Factor + SNF*Factor</code>) across 300+ collections with 0ms re-render lag.<br/>'
                    '• <b>Optimistic UI Updates:</b> When a milk pour is logged, the ledger updates in screen state instantly (<50ms) while background network sync dispatches to Supabase in parallel.<br/>'
                    '• <b>Form State Guards:</b> Controlled input states with automatic debounce and auto-prefilling from farmer profiles ensure error-free data entry during morning rush hours.'
                ),
                (
                    '3. TypeScript 5 (Strict Mode & Zero-Knowledge Type Safety)',
                    'Why We Chose It: Financial calculations and banking transactions cannot tolerate runtime undefined/NaN bugs.',
                    '• <b>Strict Type Invariants:</b> Strongly typed data models (<code>Farmer</code>, <code>CollectionItem</code>, <code>PaymentItem</code>, <code>FormulaConfig</code>) guarantee rate formulas, milk volumes, and transaction amounts are mathematically sound.<br/>'
                    '• <b>Zero-Knowledge Masking Safety:</b> Explicit TypeScript interfaces for PII masking (<code>maskAadhaar</code>, <code>maskBankAccount</code>, <code>maskIfsc</code>) prevent unmasked financial data from being accidentally exposed in frontend React state.<br/>'
                    '• <b>Refactoring Confidence:</b> Codebase of 5,000+ lines compiles with zero errors (<code>tsc --noEmit</code>) ensuring rapid, bug-free feature releases.'
                ),
                (
                    '4. Tailwind CSS 3.4 & Custom Enterprise Design Tokens',
                    'Why We Chose It: Ultra-lightweight CSS bundle (<15KB), rapid UI development, and high outdoor legibility.',
                    '• <b>Micro Bundle Footprint:</b> Purges all unused styles via JIT (Just-In-Time) compiler, keeping CSS transfer size minuscule for low-bandwidth village networks.<br/>'
                    '• <b>Rural Sunlight High-Contrast Colors:</b> Custom emerald (<code>#064e3b</code>), cyan, and slate palette with large bold typography (48px+ rate numbers) engineered for readability on dusty, high-glare booth screens.<br/>'
                    '• <b>Responsive Mobile-First POS Layout:</b> Automatically adapts across cheap 5.5" Android smartphones, 10" POS tablets, and 24" desktop monitors with seamless grid layouts.'
                ),
                (
                    '5. Framer Motion (Hardware-Accelerated Micro-Interactions)',
                    'Why We Chose It: Native app fluidity, clear transaction feedback, and intuitive modal animations.',
                    '• <b>Zero-Lag Hardware Accelerated Transitions:</b> GPU-accelerated spring animations for Anti-Fraud Lock Modals, Instant UPI Payment Success checkmarks, and KYC Slide-over Drawers.<br/>'
                    '• <b>Cognitive Operator Feedback:</b> Pulsing live scale sensor indicators and animated success checkmarks provide unambiguous visual cues to operators, eliminating accidental double-clicks.'
                ),
                (
                    '6. Progressive Web App (PWA) & Custom Service Worker (`public/sw.js`)',
                    'Why We Chose It: Bypasses Google Play Store friction; installs in 1 click; loads instant UI shell offline.',
                    '• <b>1-Click "Add to Home Screen":</b> Farmers and booth operators install 3T Dairy as a native app icon on Android/iOS/Windows without downloading APKs or navigating app stores.<br/>'
                    '• <b>Smart Caching Architecture:</b> Service worker caches app shell, icons, and fonts for instant offline loading, while enforcing strict <b>Network-Only bypass for <code>/api/*</code> endpoints</b> to guarantee zero stale financial data.'
                ),
                (
                    '7. Real-Time Multi-Device Sync (BroadcastChannel + Storage Events + Polling)',
                    'Why We Chose It: Instant multi-screen sync on same machine and automated cross-device cloud reconciliation.',
                    '• <b>0ms Inter-Tab BroadcastChannel:</b> Actions taken in one tab (e.g. scale operator logging milk) instantly update other open tabs on the same computer with 0ms network latency.<br/>'
                    '• <b>8-Second Cross-Device Cloud Heartbeat:</b> Background polling + <code>window.focus</code> / <code>visibilitychange</code> event listeners automatically pull new farmer registrations and milk logs from other laptops/mobiles without manual browser refreshes.'
                ),
                (
                    '8. Client-Side QR Engine (`qrcode` / `qrcode.react`) & Printable Thermal Slip Engine',
                    'Why We Chose It: Zero backend roundtrips for QR generation and instant physical receipt printing.',
                    '• <b>Instant Vector QR Codes:</b> Generates scannable passbook links (<code>/farmer/[farmerId]</code>) directly on the client canvas in <5ms without calling third-party QR APIs.<br/>'
                    '• <b>Browser-Native Print Engine:</b> Clean <code>@media print</code> thermal voucher layout formats receipts with Weight, FAT, SNF, Rate, Amount, and Bank UTR for 2-inch thermal POS printers.'
                ),
                (
                    '9. Google Gemini AI Integration (AI Mitra Multilingual Assistant)',
                    'Why We Chose It: Voice-enabled, vernacular agricultural intelligence directly in the farmer\'s pocket.',
                    '• <b>Multilingual Voice & Text:</b> Operates in Marathi, Hindi, and English to help smallholder farmers diagnose cattle illnesses, optimize daily cattle feed, and increase milk FAT/SNF percentage.<br/>'
                    '• <b>Low-Latency Client Streaming:</b> Renders interactive AI diagnostic cards and practical feeding tips right inside the dashboard and farmer passbook.'
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
            'category': 'PART 2: TOP 15 JUDGES QUESTIONS & HIGH-SCORING ANSWERS',
            'bg_color': '#1e3a8a',
            'qas': [
                (
                    'Q1. Why did you choose Next.js over a standard React SPA (like Create React App / Vite)?',
                    'Next.js provides server-side rendering (SSR) for sub-second initial load on rural 3G networks and unifies frontend with serverless API route handlers in one type-safe project.',
                    '<b>Answer:</b> Standard React SPAs download large initial JavaScript bundles before rendering anything, resulting in white-screen lag on rural mobile networks. Next.js delivers pre-rendered HTML on the first request (<300ms FCP). Furthermore, Next.js App Router eliminates the need for a separate Node.js/Express backend server — our financial calculation engine, Supabase database sync, and Razorpay payment webhooks all run securely within Next.js Serverless Route Handlers with zero server maintenance overhead.'
                ),
                (
                    'Q2. Why did you build a Progressive Web App (PWA) instead of a Native Android (Kotlin/Flutter) App?',
                    'PWA eliminates app-store download friction, works across all devices (Android, iOS, Windows, Mac), and updates instantly without requiring farmers to update via Google Play Store.',
                    '<b>Answer:</b> In rural India, farmers have entry-level phones with limited internal storage (32GB/64GB) and are reluctant to download heavy 50MB APKs. With our PWA: (1) Farmers simply scan their QR code or click a link and hit "Add to Home Screen" in 1 second; (2) Center operators can use the exact same software on a Windows booth laptop or a cheap Android tablet; (3) When we push a bugfix or new formula feature, all devices receive it instantly on next load without waiting for Play Store review cycles.'
                ),
                (
                    'Q3. How do you handle State Management without Redux or Zustand? Won\'t the app get messy?',
                    'We use React 19 native hooks with localized state, custom event channels, and URL params, keeping bundle size ultra-lean without redundant Redux boilerplate.',
                    '<b>Answer:</b> Redux and Zustand add unnecessary JavaScript bundle weight (20-40KB) and architectural boilerplate for what is essentially a streamlined dairy workflow. We utilize: (1) React 19 <code>useMemo</code> for computing derived financial states (live daily totals, rate matrix); (2) <code>BroadcastChannel</code> API for instant inter-tab state sync; and (3) Dynamic route segments (<code>/branch/[branchId]</code>) to encapsulate localized state. This achieves zero-overhead, predictable state transitions with 100% type safety.'
                ),
                (
                    'Q4. How does the frontend handle slow, unstable 2G/3G rural network connections?',
                    'Through an Offline-First architectural pattern combining Service Worker UI caching, local disk queuing, and optimistic UI updates.',
                    '<b>Answer:</b> (1) <b>Service Worker Shell:</b> The core UI layout, fonts, and stylesheets are cached locally so the app loads instantly even with zero connectivity; (2) <b>Optimistic State Updates:</b> When an operator submits a milk entry, the screen updates the ledger immediately with a green checkmark; (3) <b>Local Disk Storage:</b> Records are written to local storage and LowDB first before attempting cloud sync, guaranteeing that operator workflow is never blocked by network latency.'
                ),
                (
                    'Q5. How do you prevent UI lag when 100+ farmers arrive at the counter during the 7:00 AM rush hour?',
                    'Debounced search inputs, memoized virtual table rendering, and sub-millisecond local CPU math calculations.',
                    '<b>Answer:</b> (1) Rate calculations (Weight × Rate) execute in <0.1ms directly on the client CPU using pre-memoized formula weights; (2) The Farmer Directory and Collection Ledger use optimized keying and slice-based pagination to render only visible DOM nodes; (3) The farmer search bar uses debounced regex filtering across 500+ records in under 2 milliseconds.'
                ),
                (
                    'Q6. How does your frontend prevent operator fraud (e.g. logging milk twice in the same shift)?',
                    'A double-layer Anti-Fraud Shift Lock operating on both client state and serverless route handlers.',
                    '<b>Answer:</b> When an operator selects a farmer and clicks "Submit", the frontend checks if that farmer has an existing delivery for today\'s Morning or Evening shift using our intelligent <code>getCollectionShift</code> resolver. If a duplicate exists, the UI instantly triggers a prominent <b>Red Anti-Fraud Lock Modal</b>, blocking the entry and requiring an explicit Super Admin override PIN. The backend API independently validates this lock, preventing collusion even if client-side code is tampered with.'
                ),
                (
                    'Q7. How do you protect sensitive farmer PII (Aadhaar, Bank Account, IFSC) on the frontend?',
                    'Zero-Knowledge Client Masking where raw 12-digit Aadhaar and full bank account numbers are never transmitted to the browser.',
                    '<b>Answer:</b> Sensitive fields are masked on the server before the JSON response is created: Aadhaar is returned as <code>•••• •••• 7133</code> and Bank Account as <code>••••••••9012</code>. Even if a bad actor inspects the browser DevTools Network tab or LocalStorage, raw banking details are completely absent. Unmasked credentials are only accepted during write-only KYC updates over TLS 1.3 encrypted HTTPS.'
                ),
                (
                    'Q8. How does the frontend communicate with digital milk testing machines (Weighing Scales & Lactoscans)?',
                    'Through the Web Serial API / WebUSB bridge and a simulated hardware lock mode.',
                    '<b>Answer:</b> Modern Chromium browsers support the <b>Web Serial API</b>, enabling direct serial communication (RS-232 over USB at 9600 baud) between the browser and electronic milk analyzers (e.g., Ekomilk, Lactoscan). The frontend parses incoming ASCII telemetry packets (Weight, FAT, SNF) directly into React form state. To prevent manual data tampering, our "Hardware Lock" mode freezes the input fields so operators cannot manually type fake numbers.'
                ),
                (
                    'Q9. Why did you use BroadcastChannel API instead of continuous WebSockets?',
                    'BroadcastChannel provides 0ms peer-tab communication without server compute costs, while background polling handles cross-device sync efficiently.',
                    '<b>Answer:</b> Continuous WebSocket connections require dedicated stateful server instances (e.g., Socket.io servers), which increase cloud hosting costs and frequently drop connections on unstable 2G networks. <b>BroadcastChannel</b> operates natively inside the browser process with 0ms latency for all open windows on the collection booth machine. For cross-device sync, we combine this with lightweight 8-second HTTP polling and <code>visibilitychange</code> listeners, achieving real-time feel at zero infrastructure cost.'
                ),
                (
                    'Q10. How accessible is this UI for rural dairy farmers who cannot read English?',
                    'High visual affordances (icons, color coding, WhatsApp receipts) and Google Gemini AI Mitra in Marathi and Hindi.',
                    '<b>Answer:</b> (1) <b>Visual Cues:</b> Statuses use distinct colors (Green = Paid, Yellow = Pending, Red = Fraud Lock) and Lucide SVG icons (Milk can, Rupee, Shield); (2) <b>WhatsApp Auto-Slips:</b> Farmers receive a formatted vernacular WhatsApp/SMS message containing their exact weight, FAT, rate, and bank payout; (3) <b>AI Mitra Voice Assistant:</b> Farmers can interact with Google Gemini AI in their local language (Marathi/Hindi) for cattle advice.'
                ),
                (
                    'Q11. How do you handle printable physical vouchers for elderly farmers who don\'t use smartphones?',
                    'A dedicated CSS thermal print stylesheet with RBI-compliant voucher formatting that triggers window.print() directly.',
                    '<b>Answer:</b> Clicking "Print Voucher" in our ledger formats a crisp 58mm/80mm thermal receipt layout containing Society Name, Shift, Farmer ID, Milk Volume, FAT%, SNF%, Rate/L, Net Payout, and Bank UTR. It interfaces directly with standard USB/Bluetooth thermal POS receipt printers without requiring third-party print drivers.'
                ),
                (
                    'Q12. What happens if an operator enters an abnormal milk reading (e.g. 500 Liters or 15% FAT)?',
                    'Client-side sanity guardrails and biological threshold validation.',
                    '<b>Answer:</b> The input forms enforce biological validation boundaries: Milk weight is capped at reasonable batch limits (0.5L - 100L per single pour), FAT is constrained to 1.5% - 12.0%, and SNF is constrained to 6.0% - 12.0%. Any input outside standard biological dairy parameters displays an instant warning preventing erroneous bank disbursements.'
                ),
                (
                    'Q13. How do you ensure the frontend works across different screen sizes and devices?',
                    'A responsive fluid Tailwind CSS grid system with touch-optimized 48px hit targets.',
                    '<b>Answer:</b> The interface is designed mobile-first. On smartphones, navigation collapses into an intuitive bottom drawer and tab bar; on tablets and laptops, it expands into an expansive split-view POS layout where the live scale logger sits on the left and the real-time delivery ledger sits on the right. All buttons maintain a minimum 48×48px tap target for comfortable touch operation with wet or gloved hands.'
                ),
                (
                    'Q14. How does your frontend integrate with Razorpay and UPI for Instant Payouts?',
                    'A dedicated Razorpay modal workflow with simulated sandbox testing and real RBI gateway disbursement pipeline.',
                    '<b>Answer:</b> The UI triggers Razorpay standard checkout / payout modal passing order parameters. Upon completion, the frontend captures the transaction UTR number, validates payment status, updates the delivery ledger with a verified "SUCCESS" badge, and generates the shareable WhatsApp voucher in a single seamless flow.'
                ),
                (
                    'Q15. If judges ask: "What is the single biggest frontend engineering challenge you solved in 3T Dairy?"',
                    'Building an enterprise fintech POS that runs at 60fps in the browser, works completely offline in remote villages, and guarantees zero financial calculation errors.',
                    '<b>Answer:</b> Our greatest accomplishment was balancing <b>sub-second speed with absolute financial integrity</b>. We built a zero-dependency local formula engine that calculates rates in <1ms, unified it with an offline-first PWA caching shell, and integrated multi-layer anti-fraud shift locking — all packaged in an ultra-clean, intuitive interface that any village operator can master in under 5 minutes.'
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
    build_pdf('3T_Dairy_Frontend_Technologies_and_Judges_QnA.pdf')
