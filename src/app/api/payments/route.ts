import { NextResponse } from 'next/server';
import { getDb, syncPaymentStatusToSupabase } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json({ success: true, data: db.data.payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, timeline } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Payment ID and Status are required' }, { status: 400 });
    }

    const db = await getDb();
    const index = db.data.payments.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    }

    db.data.payments[index].status = status;
    if (timeline) {
      db.data.payments[index].timeline = timeline;
    }
    
    await Promise.all([
      db.write(),
      syncPaymentStatusToSupabase(id, status, db.data.payments[index].timeline)
    ]).catch(err => console.warn('[Payment Sync Error]', err));

    return NextResponse.json({ success: true, data: db.data.payments[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
