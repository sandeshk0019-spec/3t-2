# Third-Party Software & Open-Source Licenses

This document contains licensing and attribution information for all third-party and open-source packages, libraries, fonts, icons, and components used in the **3T (Time To Time) Dairy Fintech Platform**.

---

## 1. Executive Summary & Commercial Readiness

* **Commercial Startup Safety:** ✅ **100% Safe for Commercial Use**
* **Copyleft Risk (GPL / AGPL):** 🛡️ **0% (Zero copyleft components)**
* **License Types:** Permissive (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, SIL OFL-1.1).
* **Proprietary Rights:** You retain 100% full proprietary ownership of your business logic, custom UI designs, financial calculation algorithms, and branding.

---

## 2. Frontend Libraries & Packages

| Package / Library | Purpose in 3T | License | Commercial Use | Attribution Required? |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js** (
ext) | Core full-stack React framework & SSR engine | MIT | ✅ Yes | Retain copyright notice in source |
| **React & React-DOM** | Component UI library & client rendering | MIT | ✅ Yes | Retain copyright notice in source |
| **Lucide React** (lucide-react) | UI and dashboard icons (milk, rupee, user, etc.) | ISC / MIT | ✅ Yes | None required in production builds |
| **Framer Motion** (ramer-motion) | Smooth page transitions and modal animations | MIT | ✅ Yes | Retain copyright notice in source |
| **Recharts** (
echarts) | Dairy collection & payout analytics charts | MIT | ✅ Yes | Retain copyright notice in source |
| **Supabase Client** (@supabase/supabase-js) | Cloud database & multi-device sync client | MIT | ✅ Yes | Retain copyright notice in source |
| **Razorpay SDK** (
azorpay) | Instant UPI payout & order creation integration | MIT | ✅ Yes | Retain copyright notice in source |
| **QRCode** (qrcode) | Dynamic farmer UPI & ID QR code generation | MIT | ✅ Yes | Retain copyright notice in source |
| **Lowdb** (lowdb) | Ultra-fast local JSON database caching | MIT | ✅ Yes | Retain copyright notice in source |
| **Tailwind CSS** (	ailwindcss) | Modern utility-first CSS styling framework | MIT | ✅ Yes | None required in compiled CSS |
| **TypeScript** (	ypescript) | Type safety and build-time validation | Apache-2.0 | ✅ Yes | Retain copyright notice in source |
| **ESLint** (eslint) | Static code analysis and linting engine | MIT | ✅ Yes | None required in production |

---

## 3. Backend Services & Middleware

| Package / Library | Purpose in 3T | License | Commercial Use | Attribution Required? |
| :--- | :--- | :--- | :--- | :--- |
| **Express.js** (express) | REST API backend server | MIT | ✅ Yes | Retain copyright notice in source |
| **Mongoose** (mongoose) | MongoDB object modeling and schemas | MIT | ✅ Yes | Retain copyright notice in source |
| **Helmet** (helmet) | HTTP security headers and XSS protection | MIT | ✅ Yes | Retain copyright notice in source |
| **Cors** (cors) | Cross-Origin Resource Sharing middleware | MIT | ✅ Yes | Retain copyright notice in source |
| **Dotenv** (dotenv) | Environment variables configuration loader | BSD-2-Clause | ✅ Yes | Retain copyright notice in source |
| **Express Rate Limit** (express-rate-limit) | API rate limiting & DDoS protection | MIT | ✅ Yes | Retain copyright notice in source |
| **Joi** (joi) | Data schema and payload validator | BSD-3-Clause | ✅ Yes | Retain copyright notice in source |
| **Body-Parser** (ody-parser) | Request JSON body parsing middleware | MIT | ✅ Yes | Retain copyright notice in source |

---

## 4. Web Fonts & Typography

All web fonts are loaded via Google Fonts and are licensed under the **SIL Open Font License (OFL-1.1)**:

| Font Family | Primary Usage | License | Commercial Web & App Use |
| :--- | :--- | :--- | :--- |
| **Inter** | Primary body and UI typography | SIL OFL-1.1 | ✅ 100% Free for Commercial Use |
| **Syne** | Bold fintech headings & statistics | SIL OFL-1.1 | ✅ 100% Free for Commercial Use |
| **Plus Jakarta Sans** | Display titles and card accents | SIL OFL-1.1 | ✅ 100% Free for Commercial Use |
| **Outfit** | Clean metrics and ledger figures | SIL OFL-1.1 | ✅ 100% Free for Commercial Use |
| **Playfair Display** | Editorial and testimonial accents | SIL OFL-1.1 | ✅ 100% Free for Commercial Use |

---

## 5. Third-Party External Web APIs

| External Service | Integration Role | Terms / License | Commercial Status |
| :--- | :--- | :--- | :--- |
| **Razorpay Checkout JS** | Dynamic client payment modal | Razorpay Terms of Service | ✅ Commercial merchant usage permitted |
| **Supabase Cloud REST API** | Cloud Postgres replication & sync | Apache-2.0 / Commercial Cloud | ✅ Commercial SaaS usage permitted |

---

## 6. Required Legal Actions for Future Startup

1. **Keep this file in repository:** Retaining this THIRD_PARTY_LICENSES.md file in your codebase completely satisfies the attribution and license notice requirements for all MIT, Apache 2.0, and BSD packages.
2. **Proprietary Protection:** You are completely free to close-source, trademark, copyright, or patent your own proprietary 3T Dairy business application and charge subscriptions without any licensing royalty.
