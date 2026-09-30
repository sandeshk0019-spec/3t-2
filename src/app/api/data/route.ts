import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { maskAadhaar, maskBankAccount, maskIfsc } from '@/app/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    
    // Server-Side PII Masking: Raw Aadhaar, Bank Account, and IFSC never leave the server
    const safeFarmers = (db.data.farmers || [])
      .filter(f => {
        if (!f.id) return false;
        const idUpper = f.id.toUpperCase();
        return !idUpper.startsWith('NOTIF-') && !idUpper.startsWith('CONFIG-') && !idUpper.startsWith('DELNOTIF-');
      })
      .map(f => ({
        ...f,
        aadhaar: maskAadhaar(f.aadhaar),
        bankAccount: maskBankAccount(f.bankAccount),
        ifsc: maskIfsc(f.ifsc)
      }));

    const safeCollections = (db.data.collections || []).filter(c => {
      if (!c.id) return false;
      const idUpper = c.id.toUpperCase();
      if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
      if (c.time === 'NOTIF' || c.time === 'CONFIG' || c.time === 'DELNOTIF') return false;
      return true;
    });

    const safePayments = (db.data.payments || []).filter(p => {
      if (!p.id) return false;
      const idUpper = p.id.toUpperCase();
      if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
      if (p.time === 'NOTIF' || p.time === 'CONFIG' || p.time === 'DELNOTIF') return false;
      return true;
    });

    const deletedNotifSet = new Set((db.data.deletedNotifications || []).map((d: string) => (d || '').trim().toUpperCase()));
    const safeNotifications = (db.data.notifications || []).filter(n => !deletedNotifSet.has((n.id || '').toUpperCase()));

    return NextResponse.json(
      {
        success: true,
        data: {
          ...db.data,
          farmers: safeFarmers,
          collections: safeCollections,
          payments: safePayments,
          notifications: safeNotifications
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    console.error('Failed to read database state:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch database data' },
      { status: 500 }
    );
  }
}
