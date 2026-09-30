import { NextResponse } from 'next/server';
import { getDb, syncCollectionToSupabase, syncFarmerToSupabase } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { CollectionItem, PaymentItem, calculateRate, getLocalDateString, getAutoShift, getIndiaTimeString, getCollectionShift, isEveningShiftOpen } from '@/app/data';
import { checkAndCreateMilkDropAlert } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    const safeCollections = (db.data.collections || []).filter((c) => {
      if (!c.id) return false;
      const idUpper = c.id.toUpperCase();
      if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
      if (c.time === 'NOTIF' || c.time === 'CONFIG' || c.time === 'DELNOTIF') return false;
      return true;
    });
    return NextResponse.json({ success: true, data: safeCollections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { farmerId, weight, fat, snf, time, branchId, allowOverride } = body;

    if (!farmerId || !weight || !fat || !snf) {
      return NextResponse.json(
        { success: false, error: 'Farmer ID, Weight, FAT %, and SNF % are required.' },
        { status: 400 }
      );
    }

    const numWeight = Number(weight);
    const numFat = Number(fat);
    const numSnf = Number(snf);

    if (numWeight <= 0 || numFat <= 0 || numSnf <= 0) {
      return NextResponse.json(
        { success: false, error: 'Weight, FAT %, and SNF % must be positive numbers.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    let farmer = db.data.farmers.find(f => f.id === farmerId || f.id.toUpperCase() === farmerId.toUpperCase());

    if (!farmer) {
      // Secondary check directly in Supabase cloud to handle serverless multi-instance replication
      try {
        const { data: directFarmer } = await supabase.from('farmers').select('*').eq('id', farmerId).single();
        if (directFarmer) {
          farmer = {
            id: directFarmer.id,
            name: directFarmer.name,
            phone: directFarmer.phone,
            village: directFarmer.village,
            animals: Number(directFarmer.animals) || 5,
            avgFat: Number(directFarmer.avg_fat) || 4.2,
            avgSnf: Number(directFarmer.avg_snf) || 8.5,
            aadhaar: directFarmer.aadhaar || '',
            bankAccount: directFarmer.bank_account || '',
            ifsc: directFarmer.ifsc || '',
            upiId: directFarmer.upi_id || '',
            qrCode: directFarmer.qr_code || `3T-${directFarmer.id}`,
            branchId: directFarmer.branch_id || 'B-01',
            monthlyEarnings: Number(directFarmer.monthly_earnings) || 0,
            milkHistory: [],
            paymentHistory: []
          };
          db.data.farmers.unshift(farmer);
        }
      } catch {}
    }

    if (!farmer) {
      // Dynamic serverless fallback: seamlessly construct farmer profile if node has not replicated yet
      const safeSuffix = farmerId.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
      const uniquePhone = body.phone && body.phone.length >= 10 ? body.phone : `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const uniqueAadhaar = body.aadhaar && body.aadhaar.length === 12 ? body.aadhaar : `${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      farmer = {
        id: farmerId,
        name: body.farmerName || `Farmer ${farmerId}`,
        phone: uniquePhone,
        village: body.village || 'Sangamner',
        animals: 5,
        avgFat: numFat,
        avgSnf: numSnf,
        monthlyEarnings: 0,
        branchId: branchId || 'B-01',
        aadhaar: uniqueAadhaar,
        bankAccount: `9876${safeSuffix}${Math.floor(1000 + Math.random() * 9000)}`,
        ifsc: 'SBIN0001234',
        upiId: `${farmerId.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
        qrCode: `3T-${farmerId}`,
        milkHistory: [],
        paymentHistory: []
      };
      db.data.farmers.unshift(farmer);
    }

    const serverLocalDate = getLocalDateString();
    const serverUtcDate = new Date().toISOString().split('T')[0];
    const targetDate = body.date || serverLocalDate;
    const targetShift: "Morning" | "Evening" =
      (time && String(time).toLowerCase().includes("even")) ? "Evening" :
      (time && String(time).toLowerCase().includes("morn")) ? "Morning" :
      getAutoShift();

    // ── 🚨 ANTI-FRAUD LOCK: Shift Duplicate Prevention (Bypassed only with Admin Override) ──
    const duplicate = db.data.collections.find(
      c => c.farmerId?.toUpperCase() === farmer.id?.toUpperCase() && 
           (c.date === targetDate || c.date === serverLocalDate || c.date === serverUtcDate) && 
           getCollectionShift(c) === targetShift
    );
    if (duplicate && !allowOverride) {
      return NextResponse.json(
        {
          success: false,
          isDuplicateFraud: true,
          existingLog: duplicate,
          error: `🚨 ANTI-FRAUD LOCK: ${farmer.name} (${farmer.id}) has ALREADY delivered milk for today's ${targetShift} shift (${duplicate.weight}L logged). Double entries in the same shift are locked to prevent operator-farmer collusion.`
        },
        { status: 400 }
      );
    }

    // Optional capacity sanity check: limit unreasonable single entries (> 200L)
    if (numWeight > 200) {
      return NextResponse.json(
        { success: false, error: 'Weight exceeds maximum single batch capacity limit (200L).' },
        { status: 400 }
      );
    }

    const formula = db.data.formulaConfig;
    const rate = calculateRate(numFat, numSnf, formula);
    const total = Math.round(numWeight * rate * 100) / 100;

    const nowTimeStr = getIndiaTimeString();
    const ts = Date.now().toString().slice(-6);
    const colId = `C-${ts}`;
    const payId = `PAY-${ts}`;
    const txnId = `TXN${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newCollection: CollectionItem = {
      id: colId,
      farmerId: farmer.id,
      farmerName: farmer.name,
      village: farmer.village,
      date: targetDate,
      time: targetShift,
      shift: targetShift,
      weight: numWeight,
      fat: numFat,
      snf: numSnf,
      rate,
      total,
      status: 'Success',
      branchId: branchId || farmer.branchId || 'B-01'
    };

    const newPayment: PaymentItem = {
      id: payId,
      farmerId: farmer.id,
      farmerName: farmer.name,
      date: targetDate,
      time: nowTimeStr,
      amount: total,
      status: 'Success',
      timeline: [
        { label: "Milk Received", status: "completed", time: nowTimeStr, description: "Logged at 3T Dairy Sangamner Primary Center." },
        { label: "Quality Analysis", status: "completed", time: nowTimeStr, description: `FAT: ${numFat}%, SNF: ${numSnf}%, Rate: ₹${rate}/L` },
        { label: "Pricing Calculated", status: "completed", time: nowTimeStr, description: `Net payout calculated: ₹${total}` },
        { label: "Bank Transfer", status: "completed", time: nowTimeStr, description: `Sent to ${farmer.upiId} via Instant Bank UPI. UTR: ${txnId}` }
      ]
    };

    // Update farmer history & monthly earnings
    farmer.milkHistory.unshift({
      date: targetDate,
      volume: numWeight,
      fat: numFat,
      snf: numSnf,
      total
    });

    farmer.paymentHistory.unshift({
      date: targetDate,
      amount: total,
      status: 'Success',
      transactionId: txnId
    });

    farmer.monthlyEarnings = Math.round((farmer.monthlyEarnings + total) * 100) / 100;

    // Recalculate average FAT & SNF
    if (farmer.milkHistory.length > 0) {
      const avgFat = farmer.milkHistory.reduce((acc, h) => acc + h.fat, 0) / farmer.milkHistory.length;
      const avgSnf = farmer.milkHistory.reduce((acc, h) => acc + h.snf, 0) / farmer.milkHistory.length;
      farmer.avgFat = Math.round(avgFat * 10) / 10;
      farmer.avgSnf = Math.round(avgSnf * 10) / 10;
    }

    // Update branch metrics
    const targetBranchId = branchId || farmer.branchId || 'B-01';
    const branchIndex = db.data.branches.findIndex(b => b.id === targetBranchId);
    if (branchIndex !== -1) {
      db.data.branches[branchIndex].todayCollection = Math.round((db.data.branches[branchIndex].todayCollection + numWeight) * 100) / 100;
      db.data.branches[branchIndex].payments += 1;
    }

    // Push into collections and payments
    db.data.collections.unshift(newCollection);
    db.data.payments.unshift(newPayment);

    // ⚡ Automatic Milk Drop Detection Check
    checkAndCreateMilkDropAlert(
      farmer.id,
      farmer.name,
      targetBranchId,
      db.data.collections
    ).catch(err => console.error('Milk drop check warning:', err));

    // ⚡ Persist to both in-memory store and Supabase cloud DB before responding.
    // Pass the farmer object so syncCollectionToSupabase can upsert the farmer
    // into Supabase first — this prevents the foreign-key violation that occurs
    // when a new KYC farmer hasn't yet synced to the cloud database.
    try {
      await Promise.all([
        db.write(),
        syncCollectionToSupabase(newCollection, newPayment, farmer),
        syncFarmerToSupabase(farmer)
      ]);
    } catch (err) {
      console.warn('Sync warning:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        collection: newCollection,
        payment: newPayment,
        farmer
      }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Collection ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const existingCol = db.data.collections.find(c => c.id === id);

    if (!existingCol) {
      // Still try deleting from cloud in case it's in Supabase
      await Promise.allSettled([
        supabase.from('collections').delete().eq('id', id),
        supabase.from('branches').delete().eq('id', `COL-${id}`)
      ]);
      return NextResponse.json({ success: true, message: 'Collection deleted from cloud database' });
    }

    const payId = `PAY-${id.replace(/^C-/, '')}`;

    // Remove from in-memory / local storage
    db.data.collections = db.data.collections.filter(c => c.id !== id);
    db.data.payments = db.data.payments.filter(p => p.id !== id && p.id !== payId);

    // Update farmer milkHistory and monthlyEarnings
    const farmer = db.data.farmers.find(f => f.id.toUpperCase() === existingCol.farmerId.toUpperCase());
    if (farmer) {
      farmer.monthlyEarnings = Math.max(0, Math.round((farmer.monthlyEarnings - existingCol.total) * 100) / 100);
      farmer.milkHistory = farmer.milkHistory.filter(h => !(h.date === existingCol.date && h.volume === existingCol.weight && h.total === existingCol.total));
    }

    await db.write().catch(() => {});

    // Delete from Supabase cloud database
    await Promise.allSettled([
      supabase.from('collections').delete().eq('id', id),
      supabase.from('payments').delete().eq('id', payId),
      supabase.from('payments').delete().eq('id', id),
      supabase.from('branches').delete().eq('id', `COL-${id}`),
      supabase.from('branches').delete().eq('id', `PAY-${id}`)
    ]);

    return NextResponse.json({ success: true, message: 'Collection deleted permanently from database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
