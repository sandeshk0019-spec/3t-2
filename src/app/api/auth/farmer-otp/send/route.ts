import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { storeOtp } from '@/lib/farmer-otp';
import { checkRateLimit } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone: string = (body.phone || '').replace(/\D/g, '').trim();

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Rate limit: 5 OTP requests per phone per 10 minutes
    const rateKey = `farmer-otp-send:${phone}`;
    const rate = checkRateLimit(rateKey, 5, 10 * 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait 10 minutes and try again.' },
        { status: 429 }
      );
    }

    // Look up farmer by phone number
    const db = await getDb();
    const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10);
    let farmer = db.data.farmers.find(
      (f) => normalizePhone(f.phone) === normalizePhone(phone)
    );

    if (!farmer) {
      try {
        const [directRes, cloudRes] = await Promise.all([
          supabase.from('farmers').select('*'),
          supabase.from('branches').select('*').like('id', 'FARMER-%')
        ]);

        if (directRes.data) {
          const found = directRes.data.find((f: any) => normalizePhone(f.phone || '') === normalizePhone(phone));
          if (found) {
            farmer = {
              id: found.id,
              name: found.name,
              phone: found.phone,
              village: found.village,
              animals: Number(found.animals) || 5,
              avgFat: Number(found.avg_fat) || 4.2,
              avgSnf: Number(found.avg_snf) || 8.5,
              aadhaar: found.aadhaar || '',
              bankAccount: found.bank_account || '',
              ifsc: found.ifsc || '',
              upiId: found.upi_id || '',
              qrCode: found.qr_code || `3T-${found.id}`,
              branchId: found.branch_id || 'B-01',
              monthlyEarnings: Number(found.monthly_earnings) || 0,
              milkHistory: [],
              paymentHistory: []
            };
            db.data.farmers.unshift(farmer);
          }
        }

        if (!farmer && cloudRes.data) {
          for (const r of cloudRes.data) {
            try {
              const parsed = JSON.parse(r.status);
              if (normalizePhone(parsed.phone || '') === normalizePhone(phone)) {
                farmer = {
                  id: parsed.id,
                  name: parsed.name,
                  phone: parsed.phone,
                  village: parsed.village,
                  animals: Number(parsed.animals) || 5,
                  avgFat: Number(parsed.avgFat) || 4.2,
                  avgSnf: Number(parsed.avgSnf) || 8.5,
                  aadhaar: parsed.aadhaar || '',
                  bankAccount: parsed.bankAccount || '',
                  ifsc: parsed.ifsc || '',
                  upiId: parsed.upiId || '',
                  qrCode: parsed.qrCode || `3T-${parsed.id}`,
                  branchId: parsed.branchId || 'B-01',
                  monthlyEarnings: Number(parsed.monthlyEarnings) || 0,
                  milkHistory: [],
                  paymentHistory: []
                };
                db.data.farmers.unshift(farmer);
                break;
              }
            } catch {}
          }
        }
      } catch {}
    }

    if (!farmer) {
      return NextResponse.json(
        { success: false, error: 'No registered farmer account found for this number. Contact your collection center.' },
        { status: 404 }
      );
    }

    // Generate and store OTP (in-memory + Supabase cloud)
    const otp = await storeOtp(phone, farmer.id);

    // In production: send via SMS (Twilio / MSG91 / Fast2SMS)
    // For now: return OTP in response for demo/testing
    console.log(`[OTP] Phone: ${phone} | Farmer: ${farmer.name} (${farmer.id}) | OTP: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${phone.slice(0, 5)}XXXXX`,
      farmerName: farmer.name,
      // Remove the below in production — only for demo
      _demo_otp: otp,
    });
  } catch (error: any) {
    console.error('[farmer-otp/send] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
