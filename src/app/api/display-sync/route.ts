import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory cache across serverless warm requests
const displayMemoryStore = new Map<string, { state: any; updatedAt: number }>();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || 'B-01';

    // 1. Check in-memory store
    const cached = displayMemoryStore.get(branchId);
    if (cached && Date.now() - cached.updatedAt < 5000) {
      return NextResponse.json({ success: true, state: cached.state, source: 'memory' });
    }

    // 2. Fallback to Supabase Cloud store
    try {
      const { data } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', `DUAL-DISPLAY-${branchId}`)
        .single();

      if (data && data.qr_code) {
        const parsed = JSON.parse(data.qr_code);
        displayMemoryStore.set(branchId, { state: parsed, updatedAt: Date.now() });
        return NextResponse.json({ success: true, state: parsed, source: 'cloud' });
      }
    } catch {}

    if (cached) {
      return NextResponse.json({ success: true, state: cached.state, source: 'stale_memory' });
    }

    return NextResponse.json({ success: true, state: null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const branchId = body.branchId || 'B-01';

    // 1. Update in-memory store immediately
    displayMemoryStore.set(branchId, { state: body, updatedAt: Date.now() });

    // 2. Persist to Supabase Cloud asynchronously so any remote device (Phone / TV) gets it
    const cloudRow = {
      id: `DUAL-DISPLAY-${branchId}`,
      name: `Dual Display ${branchId}`,
      phone: 'SYSTEM',
      village: branchId,
      animals: 0,
      avg_fat: 0,
      avg_snf: 0,
      monthly_earnings: 0,
      branch_id: branchId,
      aadhaar: 'DISPLAY',
      bank_account: '',
      ifsc: '',
      upi_id: '',
      qr_code: JSON.stringify(body)
    };

    // Persist to Supabase Cloud so any remote device (Phone / TV) gets it
    try {
      await supabase.from('farmers').upsert(cloudRow);
    } catch {}

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
