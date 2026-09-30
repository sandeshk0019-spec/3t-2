# 3T Secure Payout Backend

This is the enterprise-grade, hacker-proof Node.js and Express backend for **3T (Time To Time)**, integrating instant direct-to-bank settlements with strict security validations.

---

## 🔒 Security Features Implemented

1. **Environment Variables:** All API keys, DB connections, and secrets are managed via `.env` and never hardcoded in the codebase.
2. **HMAC Signature Verification:** Mathematically checks gateway webhooks using SHA256 signatures to verify authenticity before updating database records.
3. **NoSQL Injection Protection:** Input validation and parameter sanitization using the `Joi` schema library blocks injection attacks on inputs.
4. **Brute-Force Rate Limiting:** Limits the `/api/pay-farmer` route to a maximum of 5 requests per minute per IP to block wallet drain attacks.
5. **Helmet.js HTTP Headers:** Hardens the HTTP response headers to defend against cross-site scripting (XSS), sniff attacks, and frame hijacking.
6. **Zero-Word Compliance:** Ensured that the forbidden word 'AI' is never used in any error message or responces.

---

## 🚀 Installation & Setup

### 1. Install Dependencies
Navigate to the backend directory and run:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy the configuration template and populate it with your database and API credentials:
```bash
cp .env.example .env
```
Edit the `.env` file:
* Set `MONGODB_URI` to your MongoDB database address.
* Set `PAYOUT_API_KEY` and `PAYOUT_SECRET` to your RazorpayX merchant keys.
* Set `WEBHOOK_SECRET` to your webhook callback secret.

### 3. Run the Server
* **For development (Auto-reload):**
  ```bash
  npm run dev
  ```
* **For production:**
  ```bash
  npm start
  ```

---

## 📡 API Endpoints

* **POST `/api/pay-farmer`**
  - **Payload Required:** `name`, `phone`, `village`, `animals`, `aadhaar`, `bankAccount`, `ifsc`, `upiId`, `amount`
  - **Protections:** Strictly validated by Joi, helmet-secured, rate-limited to 5 requests/min.

* **POST `/api/webhooks/payout`**
  - **Payload Required:** Razorpay/Cashfree webhook event notification.
  - **Protections:** Validated via HMAC signature using your `WEBHOOK_SECRET`.
