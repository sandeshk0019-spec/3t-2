import { NextRequest, NextResponse } from 'next/server';
import { getDb, syncFarmerToSupabase } from '@/lib/db';
import { verifyOtp } from '@/lib/farmer-otp';
import { sanitize, validateAadhaar, validateIFSC } from '@/lib/auth';
import { maskAadhaar, maskBankAccount, maskIfsc, formatToIndiaTime, getLocalDateString } from '@/app/data';
import { Notification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farmerId, otp, updates } = body;

    if (!farmerId || !otp) {
      return NextResponse.json({ success: false, error: 'Farmer ID and OTP are required' }, { status: 400 });
    }

    const db = await getDb();
    const farmerIndex = db.data.farmers.findIndex(f => f.id.toUpperCase() === farmerId.toUpperCase());

    if (farmerIndex === -1) {
      return NextResponse.json({ success: false, error: 'Farmer not found' }, { status: 404 });
    }

    const farmer = db.data.farmers[farmerIndex];

    // 1. Verify OTP sent to farmer's mobile number
    const result = await verifyOtp(farmer.phone, otp);
    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error || 'Invalid or expired OTP' }, { status: 401 });
    }

    // 2. Validate & Sanitize updates
    const safeUpdates: any = {};

    if (updates.name) safeUpdates.name = sanitize(updates.name);
    if (updates.phone) safeUpdates.phone = sanitize(updates.phone);
    if (updates.village) safeUpdates.village = sanitize(updates.village);
    if (updates.animals !== undefined) safeUpdates.animals = Math.max(1, Number(updates.animals) || 1);
    if (updates.upiId) safeUpdates.upiId = sanitize(updates.upiId);

    // Banking overrides
    if (updates.bankAccount && !updates.bankAccount.includes('•') && updates.bankAccount.trim().length >= 6) {
      safeUpdates.bankAccount = sanitize(updates.bankAccount).replace(/\D/g, '');
    }

    if (updates.ifsc && !updates.ifsc.includes('•') && validateIFSC(updates.ifsc)) {
      safeUpdates.ifsc = sanitize(updates.ifsc).toUpperCase().trim();
    }

    if (updates.aadhaar && !updates.aadhaar.includes('X') && validateAadhaar(updates.aadhaar)) {
      safeUpdates.aadhaar = sanitize(updates.aadhaar).replace(/\D/g, '');
    }

    const updated = { ...farmer, ...safeUpdates };
    db.data.farmers[farmerIndex] = updated;

    // 3. Log an immutable audit security alert into farmer notifications
    if (!db.data.notifications) db.data.notifications = [];
    const notifId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newNotif: Notification = {
      id: notifId,
      title: '🔐 Bank & KYC Profile Updated',
      body: `Your linked Bank Account / UPI details were successfully updated and verified via OTP on ${getLocalDateString()} at ${formatToIndiaTime()}. If you did not authorize this change, contact helpline immediately.`,
      type: 'payment_credited',
      farmerId: farmer.id,
      branchId: farmer.branchId || 'B-01',
      createdAt: new Date().toISOString(),
      readBy: [],
      sentBy: 'SYSTEM'
    };
    db.data.notifications.unshift(newNotif);

    // Persist to local JSON and Supabase cloud
    await db.write().catch(() => {});
    await syncFarmerToSupabase(updated);

    const safeResponse = {
      ...updated,
      aadhaar: maskAadhaar(updated.aadhaar),
      bankAccount: maskBankAccount(updated.bankAccount),
      ifsc: maskIfsc(updated.ifsc)
    };

    return NextResponse.json({
      success: true,
      data: safeResponse,
      message: '✓ Bank account successfully verified via OTP and updated.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
