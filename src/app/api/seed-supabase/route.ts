import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    const farmers = db.data.farmers || [];
    const collections = db.data.collections || [];
    const payments = db.data.payments || [];

    // 1. Sync all active farmers into farmers table
    const farmerRows = farmers.map(f => ({
      id: f.id,
      name: f.name,
      phone: f.phone,
      village: f.village,
      animals: f.animals,
      avg_fat: f.avgFat,
      avg_snf: f.avgSnf,
      monthly_earnings: f.monthlyEarnings,
      branch_id: f.branchId || 'B-01',
      aadhaar: f.aadhaar,
      bank_account: f.bankAccount,
      ifsc: f.ifsc,
      upi_id: f.upiId,
      qr_code: f.qrCode
    }));

    const resFarmers = await supabase.from('farmers').upsert(farmerRows, { onConflict: 'id' });
    if (resFarmers.error) {
      return NextResponse.json({
        success: false,
        error: `Supabase 'farmers' table rejected insert: ${resFarmers.error.message} (Code: ${resFarmers.error.code})`,
        details: resFarmers.error,
        instruction: "Row-Level Security (RLS) is active in Supabase. Please run 'data/supabase_schema.sql' in your Supabase SQL Editor or set SUPABASE_SERVICE_ROLE_KEY."
      }, { status: 403 });
    }

    // 2. Sync all collections into collections table
    const colRows = collections.map(c => ({
      id: c.id,
      farmer_id: c.farmerId,
      farmer_name: c.farmerName,
      village: c.village,
      date: c.date,
      time: c.time,
      weight: c.weight,
      fat: c.fat,
      snf: c.snf,
      rate: c.rate,
      total: c.total,
      status: c.status,
      branch_id: c.branchId
    }));

    const resCols = await supabase.from('collections').upsert(colRows, { onConflict: 'id' });
    if (resCols.error) {
      return NextResponse.json({
        success: false,
        error: `Supabase 'collections' table rejected insert: ${resCols.error.message} (Code: ${resCols.error.code})`,
        details: resCols.error
      }, { status: 403 });
    }

    // 3. Sync all payments into payments table
    const payRows = payments.map(p => ({
      id: p.id,
      farmer_id: p.farmerId,
      farmer_name: p.farmerName,
      date: p.date,
      time: p.time,
      amount: p.amount,
      status: p.status,
      timeline: p.timeline
    }));

    const resPays = await supabase.from('payments').upsert(payRows, { onConflict: 'id' });
    if (resPays.error) {
      return NextResponse.json({
        success: false,
        error: `Supabase 'payments' table rejected insert: ${resPays.error.message} (Code: ${resPays.error.code})`,
        details: resPays.error
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${farmers.length} farmers, ${collections.length} collections, and ${payments.length} payments to Supabase Cloud!`,
      farmersCount: farmers.length,
      collectionsCount: collections.length,
      paymentsCount: payments.length
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
