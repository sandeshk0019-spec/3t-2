const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production';

// ─────────────────────────────────────────────────────────────────────────────
// HMAC-SHA256 using WebCrypto API (works in both Edge Runtime and Node.js)
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionPayload {
  email: string;
  name: string;
  role: string;
  exp: number;
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

/** Sign session data → returns HMAC-signed tamper-proof token */
export async function signSession(payload: SessionPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload);
  const data = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

/** Verify + decode a session token. Returns payload or null if invalid/expired. */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;

    const key = await getKey();
    const sigBytes = fromB64url(sig);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(data)
    );
    if (!valid) return null;

    const json = Buffer.from(data, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(json);
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Sanitize a string input — strip HTML tags and dangerous chars (XSS prevention) */
export function sanitize(input: string): string {
  return input
    .replace(/[<>'"&]/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#x27;',
        '"': '&quot;',
        '&': '&amp;'
      };
      return map[char] || char;
    })
    .trim()
    .slice(0, 500); // Cap length — prevent massive payloads
}

/** Validate Aadhaar — must be exactly 12 digits (spaces allowed) */
export function validateAadhaar(aadhaar: string): boolean {
  if (!aadhaar) return false;
  const digits = aadhaar.replace(/\s+/g, '');
  return /^\d{12}$/.test(digits);
}

/** Validate IFSC code — 11 alphanumeric characters */
export function validateIFSC(ifsc: string): boolean {
  if (!ifsc) return false;
  const clean = ifsc.trim().toUpperCase();
  return /^[A-Z0-9]{11}$/.test(clean);
}

/** Validate Indian phone number — 10 to 12 digits */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[\s\-\+]/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

/** Simple in-memory rate limiter — max N requests per windowMs per key */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}
