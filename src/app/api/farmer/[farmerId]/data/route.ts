import { NextRequest, NextResponse } from 'next/server';
import { getDb, refreshFromSupabase } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { parseDateTimeToEpoch } from '@/app/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/farmer/[farmerId]/data
// Returns fresh collections and payments for one farmer.
// Used by the LivePassbookLedger component to poll for real-time updates.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ farmerId: string }> | { farmerId: string } }
) {
  try {
    const resolved = await Promise.resolve(params);
    const farmerId = resolved.farmerId?.toUpperCase();

    if (!farmerId) {
      return NextResponse.json({ success: false, error: 'Farmer ID required' }, { status: 400 });
    }

    // Refresh from cloud with cached TTL and timeout protection
    await refreshFromSupabase(false);

    const db = await getDb();
    let farmer = db.data.farmers.find(f => f.id.toUpperCase() === farmerId);

    if (!farmer) {
      try {
        const { data: directFarmer } = await supabase.from('farmers').select('*').eq('id', farmerId).single();
        if (directFarmer) {
          farmer = {
            id: directFarmer.id,
            name: directFarmer.name,
            phone: directFarmer.phone,
            village: directFarmer.village || 'Sangamner',
            animals: Number(directFarmer.animals) || 5,
            avgFat: typeof directFarmer.avg_fat === 'number' ? directFarmer.avg_fat : (directFarmer.avg_fat ? Number(directFarmer.avg_fat) : 0),
            avgSnf: typeof directFarmer.avg_snf === 'number' ? directFarmer.avg_snf : (directFarmer.avg_snf ? Number(directFarmer.avg_snf) : 0),
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
      return NextResponse.json({ success: false, error: 'Farmer not found' }, { status: 404 });
    }

    let collections = db.data.collections
      .filter(c => c.farmerId?.toUpperCase() === farmer.id.toUpperCase())
      .sort((a, b) => parseDateTimeToEpoch(b.date, b.time) - parseDateTimeToEpoch(a.date, a.time) || (b.id || '').localeCompare(a.id || ''));

    let payments = db.data.payments
      .filter(p => p.farmerId?.toUpperCase() === farmer.id.toUpperCase())
      .sort((a, b) => parseDateTimeToEpoch(b.date, b.time) - parseDateTimeToEpoch(a.date, a.time) || (b.id || '').localeCompare(a.id || ''));

    const totalEarnings = collections.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
    const avgFat = collections.length > 0
      ? Math.round((collections.reduce((acc, c) => acc + (Number(c.fat) || 0), 0) / collections.length) * 10) / 10
      : 0.0;
    const avgSnf = collections.length > 0
      ? Math.round((collections.reduce((acc, c) => acc + (Number(c.snf) || 0), 0) / collections.length) * 10) / 10
      : 0.0;

    return NextResponse.json(
      {
        success: true,
        collections,
        payments,
        farmer: {
          id: farmer.id,
          monthlyEarnings: totalEarnings > 0 ? Math.round(totalEarnings * 100) / 100 : farmer.monthlyEarnings,
          avgFat,
          avgSnf,
          animals: farmer.animals
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
