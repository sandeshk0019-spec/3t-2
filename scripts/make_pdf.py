# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, KeepTogether
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
        if self._pageNumber > 1:
            self.setFont('Helvetica-Bold', 8)
            self.setFillColor(colors.HexColor('#064e3b'))
            self.drawString(40, 760, '3T DAIRY - SMART INDIA HACKATHON (SIH) TOP 20 DEFENSE Q&A')
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawRightString(572, 760, 'Jury & Technical Panel Preparation')
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(40, 752, 572, 752)
        
        self.setFont('Helvetica', 8)
        self.setFillColor(colors.HexColor('#64748b'))
        self.drawString(40, 30, '3T Dairy Management Platform | Smart India Hackathon Defense Master Guide')
        self.drawRightString(572, 30, f'Page {self._pageNumber} of {page_count}')
        self.setStrokeColor(colors.HexColor('#e2e8f0'))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        self.restoreState()

def create_pdf(filename):
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
    c_dark = colors.HexColor('#0f172a')
    c_muted = colors.HexColor('#475569')
    c_border = colors.HexColor('#e2e8f0')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=c_muted,
        spaceAfter=10
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.white,
        spaceAfter=0
    )

    q_style = ParagraphStyle(
        'QuestionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=2
    )

    punchline_style = ParagraphStyle(
        'PunchlineStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#065f46'),
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'AnswerBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark,
        spaceAfter=5
    )

    elements = []
    elements.append(Paragraph('3T DAIRY: TOP 20 SMART INDIA HACKATHON (SIH) Q&A', title_style))
    elements.append(Paragraph('<b>Complete Master Defense Guide for Judges, Evaluators & Technical Jury Panels</b><br/>Transparent, Trustworthy, Technology-Driven Dairy Procurement & Instant Settlement Platform', subtitle_style))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=c_primary, spaceBefore=0, spaceAfter=10))

    sections_data = [
        {
            'category': 'PILLAR 1: Problem Understanding, Domain & Novelty',
            'bg_color': '#064e3b',
            'qa': [
                (
                    'Q1. What is the exact root cause of the dairy procurement problem you are solving?',
                    'Traditional dairy procurement relies on opaque manual notebooks and a 15-to-20-day delayed payment cycle, trapping farmers in debt and counter mistrust.',
                    'Dairy farmers work 365 days a year starting before sunrise, yet they face three structural handicaps: (1) <b>Working Capital Starvation:</b> Daily expenses on cattle fodder and medicines cannot wait 15-20 days, forcing farmers into local high-interest informal loans; (2) <b>Opacity in Milk Valuation:</b> Manual registers hide FAT/SNF formula mathematics, leading to frequent manipulation disputes; and (3) <b>Delayed Cattle Sickness Detection:</b> Sudden drops in milk yield go unnoticed until livestock health deteriorates significantly.'
                ),
                (
                    'Q2. There are existing solutions like Stellapps, Prompt, and Binsar. How is 3T Dairy different?',
                    'Existing apps are enterprise-heavy ERPs built for factory back-offices. 3T Dairy is a Fintech-first and Livestock-Health-first platform designed directly for the rural producer.',
                    'Unlike competitors who simply digitize weight logs and still batch payouts over 15 days through co-op banks, 3T Dairy delivers: (1) <b>Counter-Level Instant UPI Micro-Settlements:</b> Direct bank credit within seconds of milk verification; (2) <b>Zero-Downtime Offline Resilience:</b> Local disk queueing that continues rate calculation without internet; and (3) <b>AI-Driven Yield Anomaly Triggers:</b> Automated early warnings detecting cow sickness before severe milk loss occurs.'
                ),
                (
                    'Q3. Who is your primary target persona, and what is the quantified impact on their daily life?',
                    'Smallholder rural dairy farmers and women livestock keepers who manage 1 to 5 cows.',
                    'Over 70% of dairy husbandry work in India is performed by women. By transferring instant UPI payments directly to registered bank accounts and sending transparent SMS/WhatsApp itemized slips (Weight, FAT, SNF, Rate, Amount), 3T Dairy guarantees financial autonomy, eliminates middlemen cuts, saves 2-3 hours per shift in dispute resolution, and eliminates cash leakage.'
                ),
                (
                    'Q4. What validation or field research did you conduct before designing this platform?',
                    'Ground-level workflow study at Sangamner Primary Milk Intake Center (Maharashtra) and cooperative collection booths.',
                    'Our field research revealed that peak morning intake queues (6:00 AM - 8:30 AM) cannot tolerate any software lag >2 seconds per farmer. Furthermore, rural network drops happen frequently during peak collection hours. This validated our core design: a sub-second local formula engine and an offline-first architecture.'
                )
            ]
        },
        {
            'category': 'PILLAR 2: Technical Architecture, Data Flow & Tech Stack',
            'bg_color': '#0f766e',
            'qa': [
                (
                    'Q5. Why did you choose this specific tech stack (Next.js 16, Supabase, LowDB, Tailwind)?',
                    'A lightweight, unified, full-stack TypeScript architecture optimized for high-speed edge rendering and offline local disk persistence.',
                    '• <b>Next.js 16 (App Router) & React 19:</b> Full-stack SSR, serverless API route handlers, and type-safe routing in one codebase.<br/>• <b>Hybrid Database (Supabase PostgreSQL + LowDB):</b> Cloud PostgreSQL ensures relational ACID integrity and Row-Level Security, while local LowDB ensures offline persistence on the counter device.<br/>• <b>Tailwind CSS v4 & Framer Motion:</b> Hardware-accelerated, responsive UI optimized for low-spec rural Android tablets and touch terminals.'
                ),
                (
                    'Q6. Can you walk through the complete end-to-end data flow from sensor pour to bank credit?',
                    'A 5-step hardware-to-cloud-to-banking pipeline operating in under 2 seconds.',
                    '1. <b>Hardware Stream:</b> Digital Weighbridge & Ultrasonic Milk Analyzer stream gross weight, FAT%, and SNF% via RS-232/USB.<br/>2. <b>Local Computation:</b> 3T Formula Engine executes dynamic valuation in <1ms.<br/>3. <b>Local Persistence:</b> Written immediately to local hard disk cache (db.json) as a safety lock.<br/>4. <b>Cloud Sync:</b> Next.js route handler upserts records to Supabase Cloud PostgreSQL.<br/>5. <b>Fintech Dispatch:</b> Triggers Razorpay/UPI gateway payout API, returning an official Bank UTR, and dispatches the SMS slip.'
                ),
                (
                    'Q7. How does the system work when there is a complete internet outage in a remote village?',
                    '100% full-speed offline counter operation with automated background reconciliation upon reconnection.',
                    'When offline, the client detects network loss (navigator.onLine = false). The hardware continues reading, the formula engine continues calculating rates locally on the computer CPU, and entries are stamped with status: QUEUED_OFFLINE. The farmer receives a local printed/on-screen voucher slip. The moment internet reconnects, the background listener automatically batches queued entries to Supabase and triggers the bank payout dispatches without operator intervention.'
                ),
                (
                    'Q8. How do you prevent double-payouts and fraud at the collection counter?',
                    'Three-layer anti-fraud security: Shift duplicate locks, tamper-proof formula engine, and idempotent payment webhooks.',
                    '• <b>Shift Lockout Engine:</b> Prevents operator-farmer collusion by locking duplicate deliveries by the same farmer within the same morning/evening shift unless an authorized Admin override is entered.<br/>• <b>Idempotency Keys:</b> All banking API dispatch requests use unique cryptographic hash keys (PAY-COLLECTION-ID), making accidental double-disbursements technically impossible.'
                )
            ]
        },
        {
            'category': 'PILLAR 3: AI/ML, Cattle Health & IoT Hardware Integration',
            'bg_color': '#1e3a8a',
            'qa': [
                (
                    'Q9. How does the AI cattle health yield drop alert work in 3T Dairy?',
                    'Agricultural time-series anomaly detection based on individual cow baseline telemetry and parity variance.',
                    'The system maintains a rolling 14-day delivery history for each registered farmer. When a morning or evening pour drops by >25-30% below expected shift baselines, the anomaly model evaluates whether the drop is a standard diurnal fluctuation or an abnormal yield shock. If abnormal, it automatically flags potential mastitis or metabolic distress and triggers an automated SMS advisory to consult a veterinarian or AI Mitra diagnosis.'
                ),
                (
                    'Q10. How do you interface with legacy hardware analyzers already installed in village booths?',
                    'Standardized RS-232 Serial-to-USB/Bluetooth bridge driver with universal baud rate auto-negotiation.',
                    'Most ultrasonic milk analyzers (e.g., Ekomilk, Lactoscan, Essae) output ASCII telemetry strings over RS-232 serial ports at 9600/2400 baud. 3T includes a lightweight serial parser that sanitizes and reads weight, FAT, and SNF data packets directly into the browser via the Web Serial API / local micro-service.'
                ),
                (
                    'Q11. What dataset will you use to further train and refine the predictive cattle health model?',
                    'Longitudinal milk intake logs, veterinary clinical records, ICAR dairy datasets, and seasonal lactation curve data.',
                    'We leverage historical lactation cycle curves (Woods Lactation Model), temperature-humidity index (THI) meteorological data, and real-world daily FAT/SNF records to predict heat stress and onset of subclinical infections before physical symptoms appear.'
                ),
                (
                    'Q12. What if a farmer adulterates milk with water or urea to manipulate FAT/SNF readings?',
                    'Integrated multi-variable density and SNF threshold cross-validation algorithm.',
                    'Water addition artificially depresses SNF and density while unbalancing FAT:SNF ratios. The 3T formula engine includes automated sanity guards: any sample violating standard biological limits (e.g., SNF < 7.5% with abnormal density) is instantly flagged as Adulteration Suspected and quarantined for lab re-test.'
                )
            ]
        },
        {
            'category': 'PILLAR 4: Scalability, Cloud Security & Enterprise Readiness',
            'bg_color': '#4c1d95',
            'qa': [
                (
                    'Q13. If 100,000 farmers and 500 collection centers pour milk simultaneously at 7:00 AM, how will the system scale?',
                    'Stateless serverless edge compute, database connection pooling, and asynchronous Redis queue workers.',
                    '• <b>Edge Auto-Scaling:</b> Next.js Serverless Route Handlers spin up horizontally on demand across edge CDNs.<br/>• <b>PgBouncer / Supavisor Connection Pooling:</b> Manages thousands of simultaneous database connections without PostgreSQL thread exhaustion.<br/>• <b>Asynchronous Bulk Queues:</b> Heavy tasks like WhatsApp notifications and banking batch reconciliations are offloaded to background worker queues, keeping the collection UI sub-second responsive.'
                ),
                (
                    'Q14. How do you handle user authentication, data privacy, and role-based access control?',
                    'HMAC-SHA256 encrypted session tokens, HttpOnly SameSite cookies, and PostgreSQL Row-Level Security (RLS).',
                    '• <b>RBAC Separation:</b> Strict separation between Super Admin (Owner), Center Operators, and Farmers.<br/>• <b>Data Privacy:</b> Farmers can strictly view only their own personal milk passbook and payment ledger via OTP authentication.<br/>• <b>In-Transit & At-Rest Security:</b> TLS 1.3 encryption for all API communications and AES-256 encrypted cloud database storage.'
                ),
                (
                    'Q15. How do you ensure the integrity of the pricing formula so counter staff cannot alter rates?',
                    'Centralized cloud-synchronized formula configuration with immutable audit logs.',
                    'Only the authenticated Owner/Super-Admin can adjust base prices or FAT/SNF multipliers in the Settings console. When updated, the new parameters are signed, pushed to Supabase, and propagated to collection terminals with an immutable timestamped audit log.'
                ),
                (
                    'Q16. What happens if a bank UPI gateway experiences downtime during payouts?',
                    'Automated fallback retry pipeline with escrow float buffering.',
                    'If the payment gateway returns a timeout or bank server error (HTTP 502/504), the transaction is marked as PENDING_RETRY in the ledger. The background cron runner retries the dispatch every 5 minutes with exponential backoff until the bank confirms settlement.'
                )
            ]
        },
        {
            'category': 'PILLAR 5: Business Viability, Sustainability & Future Scope',
            'bg_color': '#831843',
            'qa': [
                (
                    'Q17. What is your commercial revenue and sustainability model after the hackathon?',
                    'A high-margin B2B SaaS subscription combined with fintech interchange and bulk aggregation margins.',
                    '1. <b>B2B SaaS Subscription:</b> Rs 499 - Rs 1,499/month per collection center for automated accounting, anti-fraud locks, and hardware integration.<br/>2. <b>Fintech Interchange & Float Management:</b> 0.1% micro-processing fee on automated daily settlement pipelines.<br/>3. <b>Aggregated Bulk Milk Margin:</b> Aggregating chilled, certified milk from multiple centers and supplying large brands (Amul, Mother Dairy) at premium B2B contract rates.<br/>4. <b>Value-Added Affiliate Partnerships:</b> Cattle feed suppliers, veterinary medicine manufacturers, and livestock insurance providers paying affiliate lead fees.'
                ),
                (
                    'Q18. What are the major operational risks, and what are your mitigation strategies?',
                    'Hardware sensor drift, rural digital literacy gaps, and daily working capital liquidity.',
                    '• <b>Sensor Drift:</b> Mandatory digital calibration check every morning before shift opening.<br/>• <b>Digital Literacy:</b> Simple vernacular SMS slips and printed thermal receipts so no smartphone is required for the farmer.<br/>• <b>Payout Liquidity:</b> Integration of an automated banking float buffer with partner cooperative banks.'
                ),
                (
                    'Q19. What is the current prototype readiness versus what is planned for production rollout?',
                    '100% functional full-stack software prototype ready for field deployment, with physical IoT dongle in development.',
                    '• <b>Live & Working Today:</b> Dynamic FAT/SNF formula engine, collection terminal, anti-fraud shift locks, Supabase cloud sync, LowDB offline cache, Razorpay UPI payouts, and interactive analytics.<br/>• <b>Grand Finale / Production Roadmap:</b> Custom injection-molded ESP32 hardware casing for serial analyzer ports, WhatsApp Business API green-tick verification, and Vernacular Voice-AI IVR bot.'
                ),
                (
                    'Q20. What is the one core takeaway message you want the jury to remember about 3T Dairy?',
                    '3T transforms dairy procurement from a source of farmer exploitation into an engine of dignity, instant liquidity, and livestock welfare.',
                    'By replacing 15-day payment delays and opaque paper notebooks with instant UPI micro-settlements, transparent mathematics, and automated cattle health alerts, 3T Dairy empowers the 80+ million rural households powering India White Revolution.'
                )
            ]
        }
    ]

    for sec in sections_data:
        cat_p = Paragraph(f'<b>{sec["category"]}</b>', section_style)
        cat_table = Table([[cat_p]], colWidths=[532])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(sec['bg_color'])),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(cat_table)
        elements.append(Spacer(1, 3))

        for q_title, punchline, full_answer in sec['qa']:
            qa_elements = []
            qa_elements.append(Paragraph(q_title, q_style))
            qa_elements.append(Paragraph(f'<b>[!] Key Takeaway:</b> <i>{punchline}</i>', punchline_style))
            qa_elements.append(Paragraph(full_answer, body_style))
            qa_elements.append(HRFlowable(width='100%', thickness=0.5, color=c_border, spaceBefore=2, spaceAfter=3))
            elements.append(KeepTogether(qa_elements))

        elements.append(Spacer(1, 4))

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f'Successfully generated PDF: {filename}')

if __name__ == '__main__':
    create_pdf('3T_Dairy_SIH_Top_20_QnA.pdf')