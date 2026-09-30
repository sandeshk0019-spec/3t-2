import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { storeOtp, normalizePhoneNumber } from '@/lib/farmer-otp';
import { checkRateLimit, sanitize } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farmerId, newBankAccount, newIfsc, newUpi, newAadhaar } = body;

    if (!farmerId) {
      return NextResponse.json({ success: false, error: 'Farmer ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const farmer = db.data.farmers.find(f => f.id.toUpperCase() === farmerId.toUpperCase());

    if (!farmer) {
      return NextResponse.json({ success: false, error: 'Farmer not found' }, { status: 404 });
    }

    if (!farmer.phone || farmer.phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Farmer does not have a registered mobile phone number. Cannot verify via OTP.' },
        { status: 400 }
      );
    }

    // Rate limit: max 5 bank change OTPs per farmer per 10 minutes
    const rateKey = `bank-otp-send:${farmer.id}`;
    const rate = checkRateLimit(rateKey, 5, 10 * 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests for this farmer. Please wait 10 minutes.' },
        { status: 429 }
      );
    }

    // ─── ANTI-FRAUD SYNDICATE CHECK ──────────────────────────────────────────
    // Prevent rogue operators from reusing the same bank account or UPI across multiple farmers
    if (newBankAccount) {
      const cleanBank = sanitize(newBankAccount).replace(/\D/g, '');
      const duplicateBank = db.data.farmers.find(
        f => f.id.toUpperCase() !== farmer.id.toUpperCase() && (f.bankAccount || '').replace(/\D/g, '') === cleanBank
      );
      if (duplicateBank) {
        return NextResponse.json(
          {
            success: false,
            error: `🚫 Security Alert: This Bank Account is already registered to ${duplicateBank.name} (${duplicateBank.id}). Multiple farmers cannot share the same bank account.`
          },
          { status: 400 }
        );
      }
    }

    if (newUpi) {
      const cleanUpi = sanitize(newUpi).toLowerCase().trim();
      const duplicateUpi = db.data.farmers.find(
        f => f.id.toUpperCase() !== farmer.id.toUpperCase() && (f.upiId || '').toLowerCase().trim() === cleanUpi
      );
      if (duplicateUpi) {
        return NextResponse.json(
          {
            success: false,
            error: `🚫 Security Alert: This UPI ID is already registered to ${duplicateUpi.name} (${duplicateUpi.id}). Multiple farmers cannot share the same UPI ID.`
          },
          { status: 400 }
        );
      }
    }

    if (newAadhaar) {
      const cleanAadhaar = sanitize(newAadhaar).replace(/\D/g, '');
      if (cleanAadhaar.length === 12) {
        const duplicateAadhaar = db.data.farmers.find(
          f => f.id.toUpperCase() !== farmer.id.toUpperCase() && (f.aadhaar || '').replace(/\D/g, '') === cleanAadhaar
        );
        if (duplicateAadhaar) {
          return NextResponse.json(
            {
              success: false,
              error: `🚫 Security Alert: This Aadhaar number is already registered to ${duplicateAadhaar.name} (${duplicateAadhaar.id}). Duplicate KYC is not permitted.`
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate and store OTP (valid across serverless instances)
    const otp = await storeOtp(farmer.phone, farmer.id);

    const normPhone = normalizePhoneNumber(farmer.phone);
    const maskedPhone = `+91 ••••• •${normPhone.slice(-4)}`;

    console.log(`[BANK_CHANGE_OTP] Sent OTP ${otp} to farmer ${farmer.name} (${farmer.id}) at ${maskedPhone}`);

    return NextResponse.json({
      success: true,
      maskedPhone,
      farmerName: farmer.name,
      _demo_otp: otp,
      message: `A 6-digit OTP has been sent to ${farmer.name}'s registered mobile number (${maskedPhone}).`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
