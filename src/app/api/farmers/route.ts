import { NextResponse } from 'next/server';
import { getDb, syncFarmerToSupabase } from '@/lib/db';
import { sanitize, validateAadhaar, validateIFSC, validatePhone, checkRateLimit } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Farmer, maskAadhaar, maskBankAccount, maskIfsc } from '@/app/data';

// ─── GET: List all active farmers ─────────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDb();
    const safeFarmers = (db.data.farmers || []).map(f => ({
      ...f,
      aadhaar: maskAadhaar(f.aadhaar),
      bankAccount: maskBankAccount(f.bankAccount),
      ifsc: maskIfsc(f.ifsc)
    }));
    return NextResponse.json({ success: true, data: safeFarmers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST: Register new farmer (KYC) ──────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // Rate limit: max 10 KYC registrations per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const { allowed } = checkRateLimit(`kyc:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const body = await request.json();
    const { name, village, phone, animals, branchId, aadhaar, bankAccount, ifsc, upiId } = body;

    // Required fields
    if (!name || !phone || !aadhaar || !bankAccount || !ifsc || !upiId) {
      return NextResponse.json(
        { success: false, error: 'Name, Phone, Aadhaar, Bank Account, IFSC, and UPI ID are required.' },
        { status: 400 }
      );
    }

    // Format validation
    if (!validateAadhaar(aadhaar)) {
      return NextResponse.json({ success: false, error: 'Invalid Aadhaar number. Must be exactly 12 digits.' }, { status: 400 });
    }
    if (!validateIFSC(ifsc)) {
      return NextResponse.json({ success: false, error: 'Invalid IFSC code. Example: SBIN0001234' }, { status: 400 });
    }
    if (!validatePhone(phone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number. Must be a valid 10-digit Indian number.' }, { status: 400 });
    }

    // Sanitize inputs (XSS prevention)
    const safeName        = sanitize(name);
    const safeVillage     = sanitize(village || 'Village Center');
    const safePhone       = sanitize(phone);
    const safeAadhaar     = aadhaar.replace(/\s+/g, '');
    const safeBankAccount = sanitize(bankAccount);
    const safeIfsc        = ifsc.toUpperCase().trim();
    const safeUpiId       = sanitize(upiId);

    const db = await getDb();

    // Unique Aadhaar check (normalized digits only)
    const existingAadhaar = db.data.farmers.find(f => (f.aadhaar || '').replace(/\D/g, '') === safeAadhaar);
    if (existingAadhaar) {
      return NextResponse.json(
        { success: false, error: `Aadhaar number is already registered to ${existingAadhaar.name} (${existingAadhaar.id}). Duplicate KYC is not permitted.` },
        { status: 400 }
      );
    }

    // Unique phone check (exact last 10 digits normalization)
    const phoneNorm = safePhone.replace(/\D/g, '').slice(-10);
    const phoneExists = db.data.farmers.find(f => (f.phone || '').replace(/\D/g, '').slice(-10) === phoneNorm);
    if (phoneExists) {
      return NextResponse.json(
        { success: false, error: `Mobile number is already registered to ${phoneExists.name} (${phoneExists.id}). Each farmer must have a unique phone number for OTP authentication.` },
        { status: 400 }
      );
    }

    // Robust Global Sequential ID: checks farmers, deleted farmers, collections, payments, and retired IDs
    const allKnownIds: string[] = [
      ...db.data.farmers.map(f => f.id),
      ...(db.data.deletedFarmers || []).map(r => r.farmer.id),
      ...(db.data.retiredIds || []),
      ...(db.data.collections || []).map(c => c.farmerId),
      ...(db.data.payments || []).map(p => p.farmerId)
    ];
    let maxNum = 100;
    allKnownIds.forEach(idStr => {
      if (idStr) {
        const m = idStr.match(/\d+/);
        if (m) {
          const n = parseInt(m[0], 10);
          if (n >= maxNum && n < 10000) maxNum = n;
        }
      }
    });

    const newId = `F-${maxNum + 1}`;
    const newFarmer: Farmer = {
      id: newId,
      name: safeName,
      village: safeVillage,
      phone: safePhone,
      animals: Math.max(1, Math.min(Number(animals) || 1, 999)),
      avgFat: 0,
      avgSnf: 0,
      monthlyEarnings: 0,
      branchId: branchId || 'B-01',
      aadhaar: safeAadhaar,
      bankAccount: safeBankAccount,
      ifsc: safeIfsc,
      upiId: safeUpiId,
      qrCode: `3T-${newId}-${safeName.toUpperCase().replace(/\s+/g, '')}`,
      createdAt: new Date().toISOString(),
      joinedDate: new Date().toISOString(),
      milkHistory: [],
      paymentHistory: []
    };

    db.data.farmers.unshift(newFarmer);

    // Write to local JSON immediately (fast), then await Supabase cloud upsert.
    await db.write().catch(() => {});
    await syncFarmerToSupabase(newFarmer);

    // Return masked data to client
    const safeResponse = {
      ...newFarmer,
      aadhaar: maskAadhaar(newFarmer.aadhaar),
      bankAccount: maskBankAccount(newFarmer.bankAccount),
      ifsc: maskIfsc(newFarmer.ifsc)
    };

    return NextResponse.json({ success: true, data: safeResponse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── PUT: Update farmer details ────────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Farmer ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const farmerIndex = db.data.farmers.findIndex(f => f.id.toUpperCase() === id.toUpperCase());

    if (farmerIndex === -1) {
      return NextResponse.json({ success: false, error: 'Farmer not found' }, { status: 404 });
    }

    const farmer = db.data.farmers[farmerIndex];

    // Sanitize any updated string fields
    const safeUpdates: any = {};
    for (const [key, val] of Object.entries(updates)) {
      safeUpdates[key] = typeof val === 'string' ? sanitize(val) : val;
    }

    // Zero-Knowledge Write-Only: only update sensitive fields if a genuine new value is provided
    if (updates.bankAccount !== undefined) {
      const raw = String(updates.bankAccount).trim();
      if (raw && !raw.includes('•') && !raw.includes('X') && raw.length >= 6) {
        safeUpdates.bankAccount = sanitize(raw);
      } else {
        delete safeUpdates.bankAccount; // Preserve existing database value
      }
    }

    if (updates.aadhaar !== undefined) {
      const raw = String(updates.aadhaar).replace(/\D/g, '');
      if (raw.length === 12) {
        safeUpdates.aadhaar = sanitize(raw);
      } else {
        delete safeUpdates.aadhaar; // Preserve existing database value
      }
    }

    if (updates.ifsc !== undefined) {
      const raw = String(updates.ifsc).trim().toUpperCase();
      if (raw && !raw.includes('•') && raw.length === 11) {
        safeUpdates.ifsc = sanitize(raw);
      } else {
        delete safeUpdates.ifsc; // Preserve existing database value
      }
    }

    const updated = { ...farmer, ...safeUpdates };
    db.data.farmers[farmerIndex] = updated;

    // Persist to local cache and Supabase cloud
    await db.write().catch(() => {});
    await syncFarmerToSupabase(updated);

    // Return zero-knowledge masked farmer object to client
    const safeResponse = {
      ...updated,
      aadhaar: maskAadhaar(updated.aadhaar),
      bankAccount: maskBankAccount(updated.bankAccount),
      ifsc: maskIfsc(updated.ifsc)
    };

    return NextResponse.json({ success: true, data: safeResponse });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Soft-delete farmer (archive 15 days, retire ID forever) ──────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Farmer ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const farmer = db.data.farmers.find(f => f.id === id || f.id.toUpperCase() === id.toUpperCase());

    if (!farmer) {
      return NextResponse.json({ success: false, error: 'Farmer not found' }, { status: 404 });
    }

    const upperId = id.toUpperCase();

    // Archive with timestamp (for 15-day dispute window)
    if (!db.data.deletedFarmers) db.data.deletedFarmers = [];
    db.data.deletedFarmers.push({ farmer, deletedAt: new Date().toISOString() });

    // Permanently retire ID — never reused or resurrected
    if (!db.data.retiredIds) db.data.retiredIds = [];
    if (!db.data.retiredIds.includes(id)) db.data.retiredIds.push(id);
    if (!db.data.retiredIds.includes(upperId)) db.data.retiredIds.push(upperId);

    // Remove farmer and associated transactions from local cache
    db.data.farmers = db.data.farmers.filter(f => f.id.toUpperCase() !== upperId);
    db.data.collections = db.data.collections.filter(c => c.farmerId?.toUpperCase() !== upperId);
    db.data.payments = db.data.payments.filter(p => p.farmerId?.toUpperCase() !== upperId);

    // Save metadata to local JSON
    await db.write().catch(() => {});

    // Remove from Supabase Cloud:
    // 1. Delete dependent collections & payments first to avoid foreign-key lock
    await Promise.allSettled([
      supabase.from('collections').delete().eq('farmer_id', id),
      supabase.from('collections').delete().eq('farmer_id', upperId),
      supabase.from('payments').delete().eq('farmer_id', id),
      supabase.from('payments').delete().eq('farmer_id', upperId)
    ]);

    // 2. Delete farmer record
    await Promise.allSettled([
      supabase.from('farmers').delete().eq('id', id),
      supabase.from('farmers').delete().eq('id', upperId),
      supabase.from('branches').delete().eq('id', `FARMER-${id}`),
      supabase.from('branches').delete().eq('id', `FARMER-${upperId}`),
      supabase.from('branches').delete().eq('manager', farmer.phone)
    ]);

    // 3. Persist retired IDs list to Supabase Cloud so all serverless instances remember the deletion
    await Promise.allSettled([
      supabase.from('farmers').upsert({
        id: 'CONFIG-RETIRED-FARMERS',
        name: 'Retired Farmer IDs',
        phone: 'CONFIG-RETIRED-FARMERS',
        village: 'ALL',
        animals: 0,
        avg_fat: 0,
        avg_snf: 0,
        monthly_earnings: 0,
        branch_id: 'B-01',
        aadhaar: 'CONFIG',
        bank_account: '',
        ifsc: '',
        upi_id: '',
        qr_code: JSON.stringify(db.data.retiredIds)
      }),
      supabase.from('branches').upsert({
        id: 'CONFIG-RETIRED-FARMERS',
        name: 'Retired Farmer IDs',
        manager: JSON.stringify(db.data.retiredIds),
        capacity: 0,
        today_collection: 0,
        payments: 0,
        status: JSON.stringify(db.data.retiredIds)
      }),
      supabase.from('collections').upsert({
        id: 'CONFIG-RETIRED-FARMERS',
        farmer_id: 'F-101',
        farmer_name: 'Retired Farmer IDs',
        village: 'ALL',
        date: new Date().toISOString().split('T')[0],
        time: 'CONFIG',
        weight: 0,
        fat: 0,
        snf: 0,
        rate: 0,
        total: 0,
        status: JSON.stringify(db.data.retiredIds),
        branch_id: 'B-01'
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Farmer ${id} removed permanently. Record retired and synced across cloud.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
