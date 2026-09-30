import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    
    // Check cloud settings table for latest persisted formula configuration
    try {
      const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (s && typeof s.base_price === 'number' && typeof s.fat_factor === 'number' && typeof s.snf_factor === 'number') {
        db.data.formulaConfig = {
          basePrice: Number(s.base_price),
          fatFactor: Number(s.fat_factor),
          snfFactor: Number(s.snf_factor)
        };
      }
    } catch {}

    return NextResponse.json({ success: true, data: db.data.formulaConfig });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const basePrice = Math.max(0, Number(body.basePrice));
    const fatFactor = Math.max(0, Number(body.fatFactor));
    const snfFactor = Math.max(0, Number(body.snfFactor));

    if (isNaN(basePrice) || isNaN(fatFactor) || isNaN(snfFactor)) {
      return NextResponse.json({ success: false, error: 'basePrice, fatFactor, and snfFactor must be valid numbers' }, { status: 400 });
    }

    const newConfig = {
      basePrice: Math.round(basePrice * 100) / 100,
      fatFactor: Math.round(fatFactor * 100) / 100,
      snfFactor: Math.round(snfFactor * 100) / 100
    };

    const db = await getDb();
    db.data.formulaConfig = newConfig;
    await db.write().catch(() => {});

    // Save directly to dedicated settings table in Supabase
    try {
      await supabase.from('settings').upsert({
        id: 1,
        base_price: newConfig.basePrice,
        fat_factor: newConfig.fatFactor,
        snf_factor: newConfig.snfFactor,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Supabase Settings Sync Warning]', err);
    }

    return NextResponse.json({ success: true, data: db.data.formulaConfig });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

