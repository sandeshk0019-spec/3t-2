// ─────────────────────────────────────────────────────────────────────────────
// Cloud & In-Memory Farmer OTP Store (Serverless Multi-Instance Safe)
// Each entry: { otp, farmerId, phone, expiresAt, attempts }
// Auto-expires after 10 minutes.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';

interface OtpEntry {
  otp: string;
  farmerId: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}

// In-memory cache for ultra-fast same-instance resolution
const otpStore = new Map<string, OtpEntry>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function normalizePhoneNumber(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function storeOtp(phone: string, farmerId: string): Promise<string> {
  const normPhone = normalizePhoneNumber(phone);
  const now = Date.now();
  const otp = generateOtp();
  const entry: OtpEntry = {
    otp,
    farmerId,
    phone: normPhone,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
  };

  // 1. In-memory cache
  otpStore.set(normPhone, entry);

  // 2. Persistent Supabase cloud storage (ensures OTP verifies across different serverless Lambdas)
  try {
    await supabase.from('branches').upsert({
      id: `OTP-${normPhone}`,
      name: farmerId,
      manager: normPhone,
      capacity: 0,
      today_collection: 0,
      payments: 0,
      status: JSON.stringify(entry)
    });
  } catch (err) {
    console.warn('[OTP Cloud Store Warning]', err);
  }

  return otp;
}

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ valid: boolean; farmerId?: string; error?: string }> {
  const normPhone = normalizePhoneNumber(phone);
  const trimmedOtp = (otp || '').trim();

  let entry = otpStore.get(normPhone);

  // Cross-instance fallback: fetch from Supabase Cloud
  if (!entry) {
    try {
      const { data } = await supabase.from('branches').select('*').eq('id', `OTP-${normPhone}`).single();
      if (data && data.status) {
        entry = JSON.parse(data.status);
      }
    } catch {}
  }

  if (!entry) {
    return { valid: false, error: 'No OTP request found for this number. Please request a new OTP.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normPhone);
    try { await supabase.from('branches').delete().eq('id', `OTP-${normPhone}`); } catch {}
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Check if OTP matches either the real generated OTP or the universal demo OTP (123456)
  if (entry.otp === trimmedOtp || trimmedOtp === '123456') {
    const farmerId = entry.farmerId;
    otpStore.delete(normPhone);
    try { await supabase.from('branches').delete().eq('id', `OTP-${normPhone}`); } catch {}
    return { valid: true, farmerId };
  }

  // Incorrect OTP: increment attempt count
  entry.attempts = (entry.attempts || 0) + 1;
  const remaining = MAX_ATTEMPTS - entry.attempts;

  // Persist updated attempts in memory and in Supabase Cloud across serverless Lambdas
  if (remaining <= 0) {
    otpStore.delete(normPhone);
    try { await supabase.from('branches').delete().eq('id', `OTP-${normPhone}`); } catch {}
    return { valid: false, error: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new OTP.' };
  }

  otpStore.set(normPhone, entry);
  try {
    await supabase.from('branches').upsert({
      id: `OTP-${normPhone}`,
      name: entry.farmerId,
      manager: normPhone,
      capacity: 0,
      today_collection: 0,
      payments: 0,
      status: JSON.stringify(entry)
    });
  } catch {}

  return {
    valid: false,
    error: `Incorrect OTP. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
  };
}
