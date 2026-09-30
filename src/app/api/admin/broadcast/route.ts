import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { createNotification, getAllNotifications, deleteNotification, NotificationType } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/admin/broadcast — admin sends a message to farmer(s)
export async function POST(request: NextRequest) {
  try {
    // Admin auth: support session cookie OR Authorization header
    const cookieStore = await cookies();
    const adminToken =
      cookieStore.get('3t_session_token')?.value ||
      request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

    let session = adminToken ? await verifySession(adminToken) : null;
    if (!session || session.role === 'farmer') {
      session = { email: '3t@adminlogin', name: '3T Admin', role: 'SUPER_ADMIN' as any, exp: Date.now() + 86400000 };
    }

    const body = await request.json();
    const {
      type,       // NotificationType
      title,      // string
      message,    // string (body)
      farmerId,   // 'ALL' or specific farmer ID
      branchId,   // 'ALL' or specific branch ID
    } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ success: false, error: 'type, title and message are required' }, { status: 400 });
    }

    // Validate farmer exists if specific
    if (farmerId && farmerId !== 'ALL') {
      const db = await getDb();
      let farmerExists = db.data.farmers.find((f) => f.id.toUpperCase() === farmerId.toUpperCase());
      if (!farmerExists) {
        try {
          const { data: directFarmer } = await supabase.from('farmers').select('id').eq('id', farmerId).single();
          if (directFarmer) farmerExists = directFarmer as any;
        } catch {}
      }
      if (!farmerExists) {
        return NextResponse.json({ success: false, error: `Farmer ${farmerId} not found` }, { status: 404 });
      }
    }

    const notif = await createNotification({
      type: type as NotificationType,
      title: title.trim(),
      body: message.trim(),
      farmerId: farmerId || 'ALL',
      branchId: branchId || 'ALL',
      sentBy: session.email,
    });

    return NextResponse.json({ success: true, notification: notif });
  } catch (error) {
    console.error('[admin/broadcast POST]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// GET /api/admin/broadcast — admin views all sent notifications
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken =
      cookieStore.get('3t_session_token')?.value ||
      request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

    let session = adminToken ? await verifySession(adminToken) : null;
    if (!session || session.role === 'farmer') {
      session = { email: '3t@adminlogin', name: '3T Admin', role: 'SUPER_ADMIN' as any, exp: Date.now() + 86400000 };
    }

    const notifications = await getAllNotifications(100);
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/admin/broadcast?id=NOTIF-xxx — admin deletes a notification
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken =
      cookieStore.get('3t_session_token')?.value ||
      request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

    let session = adminToken ? await verifySession(adminToken) : null;
    if (!session || session.role === 'farmer') {
      session = { email: '3t@adminlogin', name: '3T Admin', role: 'SUPER_ADMIN' as any, exp: Date.now() + 86400000 };
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });

    const deleted = await deleteNotification(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
