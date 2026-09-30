# -*- coding: utf-8 -*-
"""
3T Dairy - Easy & Simple 40 Defense Questions (20 Frontend + 20 Backend)
Specially written in simple, plain English for 1st-Year Team Members.
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
            self.drawString(40, 760, '3T DAIRY - EASY 40 DEFENSE Q&A (FOR 1ST YEAR TEAM MEMBERS)')
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawRightString(572, 760, 'Round 2 / Grand Finale Simple Guide')
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(40, 752, 572, 752)

        # Footer (All pages)
        self.setFont('Helvetica', 8)
        self.setFillColor(colors.HexColor('#64748b'))
        self.drawString(40, 30, '3T Dairy Platform | Easy Frontend (20 Qs) & Backend (20 Qs) Defense Guide')
        self.drawRightString(572, 30, f'Page {self._pageNumber} of {page_count}')
        self.setStrokeColor(colors.HexColor('#e2e8f0'))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        self.restoreState()

def build_pdf(filename="3T_Dairy_SIH_Simple_40_QnA_Master.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=38,
        rightMargin=38,
        topMargin=48,
        bottomMargin=52
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
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
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

    q_title_style = ParagraphStyle(
        'QTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=4,
        spaceAfter=1.5
    )

    punchline_style = ParagraphStyle(
        'PunchlineStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0f766e'),
        spaceAfter=1.5
    )

    body_style = ParagraphStyle(
        'ItemBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_dark,
        spaceAfter=3
    )

    elements = []

    # Document Header
    elements.append(Paragraph('3T DAIRY: EASY 40 DEFENSE Q&A (20 FRONTEND + 20 BACKEND)', title_style))
    elements.append(Paragraph('<b>Simplified, Plain-English Answers Designed for 1st-Year Team Members to Ace Round 2</b><br/>Memorize the 1-Line Punchline and say the 2 simple bullet points. High-probability questions asked by hackathon judges.', subtitle_style))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=c_primary, spaceBefore=0, spaceAfter=6))

    # =========================================================================
    # SECTION 1: FRONTEND (TOP 20 SIMPLE QUESTIONS)
    # =========================================================================
    frontend_qas = [
        (
            'Q1. What is Next.js and why are we using it for the frontend?',
            'Next.js is a modern React framework that makes web pages load super-fast on slow village 3G/4G networks.',
            '• It renders pages on the server first, so farmers see the screen in less than 0.3 seconds without a white loading screen.<br/>'
            '• It allows us to write both frontend screens and backend APIs inside one clean project without needing a separate server.'
        ),
        (
            'Q2. Why did you use React 19?',
            'React lets us build fast, interactive screens with reusable components.',
            '• When a farmer pours milk, the total price and weight calculate on the screen instantly without reloading the page.<br/>'
            '• React components keep our code neat, organized, and easy to maintain.'
        ),
        (
            'Q3. Why did you choose TypeScript instead of plain JavaScript?',
            'TypeScript stops coding mistakes before running the code so the app never crashes during milk collection.',
            '• Because we calculate money, milk weight, and rates, TypeScript ensures we never get calculation errors or blank screens.<br/>'
            '• It makes teamwork easy because everyone knows the exact shape of farmer data.'
        ),
        (
            'Q4. Why did you use Tailwind CSS for styling?',
            'Tailwind CSS makes our app lightweight, beautiful, and easy to design for both phones and laptops.',
            '• It creates a tiny CSS file (under 15KB) that downloads in milliseconds even in remote villages.<br/>'
            '• We used high-contrast dark green and white colors so operators can read the screen clearly under bright village sunlight.'
        ),
        (
            'Q5. What is a PWA (Progressive Web App) and why did we build it?',
            'PWA lets farmers install 3T Dairy on their phone home screen with 1 click without going to Google Play Store.',
            '• Farmers simply scan a QR code and tap "Add to Home Screen" — no 50MB app download required.<br/>'
            '• Whenever we update the code or fix a bug, all farmers get the update immediately on their phone.'
        ),
        (
            'Q6. Why didn\'t you build a native Android Kotlin or Flutter app?',
            'Because rural farmers have cheap budget phones with very low storage and don\'t want to download heavy apps.',
            '• Our PWA works on every device (Android, iPhone, Windows Laptop, Tablet) through any web browser.<br/>'
            '• Center operators can use the exact same software on a booth laptop or Android tablet.'
        ),
        (
            'Q7. How does the frontend work when internet is completely disconnected in a village?',
            'Our PWA Service Worker saves the app screens offline inside the browser memory.',
            '• The operator can still enter milk weight, calculate rates, and print receipts completely offline.<br/>'
            '• When internet reconnects, all saved deliveries automatically sync to the cloud database.'
        ),
        (
            'Q8. How does the milk rate calculate so fast on the screen (under 1 millisecond)?',
            'We use React\'s useMemo hook to do the math directly on the computer CPU.',
            '• The math formula <code>Weight × (Base + FAT + SNF)</code> runs inside the browser in 0.1ms.<br/>'
            '• The screen updates instantly as the operator types without waiting for any server response.'
        ),
        (
            'Q9. How does the search bar find farmers so quickly in the collection form?',
            'Instant client-side filtering by Name, ID (like F-101), or Phone number.',
            '• As you type, the dropdown list filters in real time across hundreds of farmers in under 2 milliseconds.<br/>'
            '• It also shows a green confirmation chip showing the selected farmer\'s name and village so operators don\'t make mistakes.'
        ),
        (
            'Q10. What is Framer Motion and where is it used in your UI?',
            'It is a smooth animation library used for visual feedback.',
            '• We use it for smooth popup animations: the green "Payment Success" badge, the red "Anti-Fraud Lock" modal, and KYC drawers.<br/>'
            '• Smooth animations make the web app feel like a premium, native mobile application.'
        ),
        (
            'Q11. What is Lucide React and why is it important for rural farmers?',
            'A lightweight icon library providing clear visual symbols for non-English speaking farmers.',
            '• We use clear icons like Milk Can, Rupee Symbol, QR Code, and Shield Lock.<br/>'
            '• Farmers who cannot read English can easily understand what each button does just by looking at the icons.'
        ),
        (
            'Q12. How does the QR code digital passbook work for farmers?',
            'Every farmer has a unique scannable QR code generated directly inside the browser.',
            '• When scanned with any smartphone camera, it opens the farmer\'s personal milk passbook without requiring a password.<br/>'
            '• QR codes are generated instantly on the client canvas without calling any slow third-party API.'
        ),
        (
            'Q13. What is the Anti-Fraud Shift Lock Modal on the frontend?',
            'A safety pop-up that blocks operators from entering milk twice for the same farmer in the same shift.',
            '• If a farmer already poured milk in the Morning shift, trying to log them again shows a bright Red Warning Modal.<br/>'
            '• It can only be unlocked if the dairy Super Admin enters their secret override PIN.'
        ),
        (
            'Q14. How does the frontend stop operators from typing crazy numbers like 1000 Liters?',
            'Automatic form validation guardrails.',
            '• Milk weight is limited to 0.5L - 100L per can, FAT is checked between 1.5% - 12%, and SNF between 6% - 12%.<br/>'
            '• If an operator types an impossible number, the form shows an instant error warning.'
        ),
        (
            'Q15. How do elderly farmers without smartphones get their payment slip?',
            'Via 1-click Thermal Receipt Printing and automated vernacular SMS.',
            '• The operator clicks "Print Voucher" to print a 2-inch physical paper slip on a POS receipt printer.<br/>'
            '• An automated SMS / WhatsApp slip with weight, FAT, rate, and amount is also sent to basic mobile phones.'
        ),
        (
            'Q16. What is the BroadcastChannel API and why did you use it?',
            'It allows multiple browser tabs on the same computer to talk to each other with 0ms delay.',
            '• If the scale operator logs milk in Tab 1, Tab 2 (Admin view) updates instantly without touching the internet.<br/>'
            '• It gives real-time synchronization on the counter machine with zero server costs.'
        ),
        (
            'Q17. How does the UI look on a mobile phone vs a big laptop screen?',
            'Responsive design that automatically adapts to any screen size.',
            '• On mobile phones, it shows a clean single-column view with bottom navigation tabs.<br/>'
            '• On laptops and tablets, it expands into a split-screen view: scale logger on the left and live delivery ledger on the right.'
        ),
        (
            'Q18. What is Google Gemini AI Mitra in the frontend?',
            'An AI veterinary and cattle feed assistant inside the app.',
            '• Farmers can ask questions in Marathi, Hindi, or English to diagnose cattle diseases and improve milk fat.<br/>'
            '• It shows simple, actionable tips on how to feed cows green fodder and minerals.'
        ),
        (
            'Q19. How are farmer passwords and bank details kept private on the screen?',
            'Zero-Knowledge masking: sensitive numbers are hidden behind dots.',
            '• The screen only shows masked numbers like <code>•••• •••• 7133</code> for Aadhaar and <code>••••••••9012</code> for Bank Account.<br/>'
            '• People standing in line behind the counter cannot see or steal the farmer\'s private banking details.'
        ),
        (
            'Q20. What will you say if judges ask: "Why is your UI better than existing dairy apps?"',
            '3T Dairy takes under 2 seconds per farmer, works on mobile, and gives instant UPI receipts.',
            '• Old dairy software looks like ugly 1995 accounting spreadsheets and takes 15-20 seconds per farmer.<br/>'
            '• 3T Dairy is modern, ultra-fast, works offline, and empowers farmers with live digital passbooks.'
        )
    ]

    # =========================================================================
    # SECTION 2: BACKEND (TOP 20 SIMPLE QUESTIONS)
    # =========================================================================
    backend_qas = [
        (
            'Q21. What database are you using and why?',
            'We use Supabase PostgreSQL in the cloud and LowDB (db.json) on local disk.',
            '• <b>Supabase PostgreSQL:</b> Keeps all cloud records safe, organized, and synced across all mobile passbooks.<br/>'
            '• <b>LowDB:</b> Saves milk entries directly to the counter computer disk so the app works even when village internet drops.'
        ),
        (
            'Q22. What is a Serverless API Route in Next.js?',
            'Backend code that runs instantly on-demand without needing an expensive 24/7 server.',
            '• When an operator clicks "Submit Milk", the serverless function wakes up in milliseconds, calculates rates, and saves the data.<br/>'
            '• It scales automatically during morning rush hour without costing money when idle.'
        ),
        (
            'Q23. How does the backend prevent double payments to farmers?',
            'Every payment gets a unique cryptographic Idempotency Key (like PAY-123456).',
            '• Even if an operator accidentally clicks "Pay" twice or internet lags, the banking gateway processes the transfer only once.<br/>'
            '• It guarantees that double disbursements are mathematically impossible.'
        ),
        (
            'Q24. How does the backend formula calculate milk rate and price?',
            'A transparent mathematical formula: Rate = Base Price + (FAT × FatFactor) + (SNF × SnfFactor).',
            '• If Base is ₹30, FAT is 4.2% (×5), and SNF is 8.5% (×2), Rate = 30 + 21 + 17 = ₹68/L.<br/>'
            '• Total payout is simply <code>Liters × Rate</code> (e.g. 10L × ₹68 = ₹680).'
        ),
        (
            'Q25. What is Historical Rate Freezing and why is it important?',
            'Past payments and collection records permanently lock their calculated rates.',
            '• If a farmer was paid ₹55/L yesterday, that record will always say ₹55/L.<br/>'
            '• If the dairy owner changes milk rates next week, old payment ledgers and audit records will never get corrupted.'
        ),
        (
            'Q26. How does the backend detect duplicate shift entries?',
            'Our getCollectionShift code checks the Farmer ID, Date, and Shift (Morning vs Evening).',
            '• If a delivery already exists for that farmer today in the same shift, the server rejects the second entry with an error.<br/>'
            '• This stops dishonest operators and farmers from logging the same milk twice.'
        ),
        (
            'Q27. What happens if a milk entry has a clock time like "03:55 PM" instead of "Evening"?',
            'Our intelligent shift resolver automatically converts timestamps into Morning or Evening.',
            '• Any time between 00:00 - 12:59 (AM) maps to <b>Morning</b>; any time between 13:00 - 23:59 (PM) maps to <b>Evening</b>.<br/>'
            '• This ensures duplicate prevention works reliably no matter what time format is used.'
        ),
        (
            'Q28. What happens if the village loses internet during live collection?',
            'Zero downtime: the backend writes all milk records to local hard disk in db.json.',
            '• The operator continues weighing milk and printing receipts without any interruption.<br/>'
            '• As soon as internet is restored, our background sync pushes all saved records to Supabase Cloud.'
        ),
        (
            'Q29. How do you protect farmer Aadhaar and Bank Account details in the backend API?',
            'Server-Side Zero-Knowledge Masking.',
            '• The server converts Aadhaar to <code>•••• •••• 7133</code> and Bank Account to <code>••••••••9012</code> before sending JSON to the browser.<br/>'
            '• Even if someone inspects network traffic, real bank details are never visible in plaintext.'
        ),
        (
            'Q30. What is Role-Based Access Control (RBAC) in your backend?',
            'Separating permissions between Super Admin (Owner) and Staff Operators.',
            '• <b>Super Admin:</b> Can change pricing formulas, delete farmers, and enter fraud override PINs.<br/>'
            '• <b>Staff Operator:</b> Can only log milk collections and view passbooks — they cannot alter pricing rates.'
        ),
        (
            'Q31. How are user logins and sessions secured in the backend?',
            'Encrypted HttpOnly cookies and HMAC-SHA256 session tokens.',
            '• Session tokens are stored in secure browser cookies that cannot be accessed or stolen by malicious JavaScript.<br/>'
            '• Inactive sessions automatically expire for safety.'
        ),
        (
            'Q32. How does the Razorpay / UPI Instant Payout integration work?',
            'When milk is verified, our API triggers the UPI banking gateway to transfer money instantly.',
            '• Money is credited directly to the farmer\'s bank account via UPI in under 1 second.<br/>'
            '• The bank returns an official UTR (Unique Transaction Reference) number stored on the receipt.'
        ),
        (
            'Q33. How does the Cattle Health Anomaly Detection work?',
            'The backend monitors the farmer\'s 14-day average milk yield.',
            '• If a cow\'s milk drops suddenly by more than 25-30%, the system flags potential illness (like Mastitis).<br/>'
            '• It automatically creates an alert advising the farmer to consult a veterinarian or use Gemini AI Mitra.'
        ),
        (
            'Q34. How will the backend handle 500 dairy centers logging milk at 7:00 AM rush hour?',
            'Serverless auto-scaling and database connection pooling.',
            '• Next.js serverless functions spin up in parallel across edge networks to handle thousands of requests.<br/>'
            '• Supabase PgBouncer connection pool ensures the PostgreSQL database never gets overloaded.'
        ),
        (
            'Q35. What is a Soft Delete for farmers and why is it useful?',
            'Deleted farmers are moved to a 15-day recovery archive instead of being permanently erased immediately.',
            '• This allows the dairy to resolve disputes or restore a farmer if they were deleted by accident.<br/>'
            '• After 15 days, expired records are automatically cleaned up.'
        ),
        (
            'Q36. What is the Permanent Retired Farmer ID Registry?',
            'Deleted farmer IDs (e.g. F-109) are registered in CONFIG-RETIRED-FARMERS in the cloud.',
            '• This ensures the server never re-uses deleted IDs for new farmers and never resurrects deleted mock data.<br/>'
            '• All devices and laptops stay 100% in sync regarding who is active and who is deleted.'
        ),
        (
            'Q37. How do you prevent SQL Injection and hacking attacks on the database?',
            'Parameterized SQL queries and strict input sanitization.',
            '• Supabase PostgREST client uses parameterized queries that make SQL injection impossible.<br/>'
            '• All user inputs pass through a sanitizing function that removes HTML and script tags.'
        ),
        (
            'Q38. Why is the data API configured with dynamic = "force-dynamic"?',
            'To guarantee that financial records are always 100% fresh and live.',
            '• It tells Next.js never to cache old milk or payment data.<br/>'
            '• Every time a farmer checks their passbook, they see the exact live balance.'
        ),
        (
            'Q39. How does the backend send instant WhatsApp receipts?',
            'Our API formats an itemized message and dispatches it via WhatsApp Webhook URL.',
            '• The WhatsApp message contains: Farmer Name, Date, Shift, Liters, FAT%, SNF%, Rate/L, Amount, and Bank UTR.<br/>'
            '• The farmer gets a permanent digital receipt on their phone within 2 seconds.'
        ),
        (
            'Q40. What will you say if judges ask: "Summarize your backend in one powerful sentence?"',
            'A high-speed, offline-first hybrid architecture that guarantees instant UPI payments and 100% data reliability even in remote rural villages.',
            '• It connects Next.js serverless APIs, Supabase PostgreSQL, and LowDB local disk into a fault-tolerant system.<br/>'
            '• It protects farmers from payment delays, middleman cuts, and calculation fraud.'
        )
    ]

    # Render Section 1: Frontend
    cat_p1 = Paragraph('<b>SECTION 1: FRONTEND (TOP 20 QUESTIONS & SIMPLE ANSWERS)</b>', sec_title_style)
    cat_t1 = Table([[cat_p1]], colWidths=[536])
    cat_t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#064e3b')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(cat_t1)
    elements.append(Spacer(1, 2))

    for q_title, punchline, full_answer in frontend_qas:
        q_elements = []
        q_elements.append(Paragraph(q_title, q_title_style))
        q_elements.append(Paragraph(f'<b>👉 1-Line Punchline:</b> <i>{punchline}</i>', punchline_style))
        q_elements.append(Paragraph(full_answer, body_style))
        q_elements.append(HRFlowable(width='100%', thickness=0.5, color=c_border, spaceBefore=1.5, spaceAfter=2.5))
        elements.append(KeepTogether(q_elements))

    elements.append(Spacer(1, 4))

    # Render Section 2: Backend
    cat_p2 = Paragraph('<b>SECTION 2: BACKEND (TOP 20 QUESTIONS & SIMPLE ANSWERS)</b>', sec_title_style)
    cat_t2 = Table([[cat_p2]], colWidths=[536])
    cat_t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1e3a8a')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(cat_t2)
    elements.append(Spacer(1, 2))

    for q_title, punchline, full_answer in backend_qas:
        q_elements = []
        q_elements.append(Paragraph(q_title, q_title_style))
        q_elements.append(Paragraph(f'<b>👉 1-Line Punchline:</b> <i>{punchline}</i>', punchline_style))
        q_elements.append(Paragraph(full_answer, body_style))
        q_elements.append(HRFlowable(width='100%', thickness=0.5, color=c_border, spaceBefore=1.5, spaceAfter=2.5))
        elements.append(KeepTogether(q_elements))

    # Build Document
    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"[OK] Successfully built PDF: {filename}")

if __name__ == '__main__':
    build_pdf('3T_Dairy_SIH_Simple_40_QnA_Master.pdf')
