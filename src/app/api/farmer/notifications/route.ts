import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, FARMER_COOKIE_NAME, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { getDb } from '@/lib/db';
import {
  getNotificationsForFarmer,
  getUnreadCount,
  markAllAsRead,
  markSingleNotificationAsRead,
} from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/farmer/notifications — fetch notifications for the logged-in farmer
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const farmerToken = cookieStore.get(FARMER_COOKIE_NAME)?.value || cookieStore.get('3t_farmer_token')?.value;
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value || cookieStore.get('3t_session_token')?.value;

    const paramFarmerId = request.nextUrl.searchParams.get('farmerId');
    let farmerId = paramFarmerId?.trim() || null;
    let branchId = 'ALL';

    if (!farmerId && farmerToken) {
      const session = await verifySession(farmerToken);
      if (session?.role === 'farmer') farmerId = session.name;
    } else if (!farmerId && adminToken) {
      const session = await verifySession(adminToken);
      if (session && session.role !== 'farmer') farmerId = request.nextUrl.searchParams.get('farmerId');
    }

    if (!farmerId) {
      farmerId = 'F-101';
    }

    // Get farmer's branch and registration date
    const db = await getDb();
    const farmer = db.data.farmers.find((f) => f.id.toUpperCase() === farmerId!.toUpperCase());
    if (farmer) branchId = farmer.branchId;

    const notifications = await getNotificationsForFarmer(farmerId, branchId, farmer?.createdAt || farmer?.joinedDate);
    const unreadCount = notifications.filter((n) => !n.readBy.some(r => r.toUpperCase() === farmerId!.toUpperCase())).length;

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('[farmer/notifications GET]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/farmer/notifications — mark all as read or mark a single notification as read
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const farmerToken = cookieStore.get(FARMER_COOKIE_NAME)?.value || cookieStore.get('3t_farmer_token')?.value;

    let farmerId: string | null = request.nextUrl.searchParams.get('farmerId')?.trim() || null;
    let notificationId: string | null = request.nextUrl.searchParams.get('notificationId')?.trim() || null;
    if (!farmerId || !notificationId) {
      try {
        const body = await request.json();
        if (!farmerId && body.farmerId) farmerId = body.farmerId.trim();
        if (!notificationId && body.notificationId) notificationId = body.notificationId.trim();
      } catch {}
    }

    if (!farmerId && farmerToken) {
      const session = await verifySession(farmerToken);
      if (session?.role === 'farmer') farmerId = session.name;
    }

    if (!farmerId) {
      farmerId = 'F-101';
    }

    if (notificationId) {
      await markSingleNotificationAsRead(notificationId, farmerId);
      return NextResponse.json({ success: true, markedId: notificationId });
    }

    let branchId = 'ALL';
    const db = await getDb();
    const farmer = db.data.farmers.find((f) => f.id.toUpperCase() === farmerId!.toUpperCase());
    if (farmer) branchId = farmer.branchId;

    await markAllAsRead(farmerId, branchId, farmer?.createdAt || farmer?.joinedDate);
    return NextResponse.json({ success: true, allRead: true });
  } catch (error) {
    console.error('[farmer/notifications PATCH]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
