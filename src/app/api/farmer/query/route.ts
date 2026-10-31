import { NextResponse } from 'next/server';
import { getDb, syncQueriesToCloud } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { FarmerQuery, QueryCategory, QueryStatus } from '@/app/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─────────────────────────────────────────────────────────────────────────────
// GET: Fetch queries (by farmerId for farmer passbook, or all for dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const status = searchParams.get('status');

    const db = await getDb();
    let queries = db.data.queries || [];

    if (farmerId) {
      queries = queries.filter(
        (q) => (q.farmerId || '').toUpperCase() === farmerId.trim().toUpperCase()
      );
    }

    if (status) {
      queries = queries.filter((q) => q.status === status);
    }

    // Sort newest first
    queries.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return NextResponse.json(
      {
        success: true,
        queries,
        totalCount: queries.length,
        pendingCount: queries.filter((q) => q.status === 'pending').length
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (err: any) {
    console.error('[API /api/farmer/query GET Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch queries' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Farmer raises a new query without opening mail
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      farmerId,
      farmerName,
      farmerPhone,
      category,
      subject,
      description,
      language
    } = body;

    if (!farmerId || typeof farmerId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Farmer ID is required.' },
        { status: 400 }
      );
    }

    if (!subject?.trim() && !description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide either a subject or detailed description of your issue.' },
        { status: 400 }
      );
    }

    const validCategories: QueryCategory[] = ['payment', 'technical', 'general'];
    const selectedCategory: QueryCategory = validCategories.includes(category) ? category : 'payment';

    const validLanguages = ['marathi', 'english', 'hindi'];
    const selectedLanguage = validLanguages.includes(language) ? language : 'marathi';

    const db = await getDb();
    if (!db.data.queries) db.data.queries = [];

    // Unique Query ID: QRY-YYMM-RANDOM
    const timestampPart = Date.now().toString().slice(-6);
    const randomPart = Math.floor(100 + Math.random() * 900);
    const queryId = `QRY-${timestampPart}-${randomPart}`;

    const newQuery: FarmerQuery = {
      id: queryId,
      farmerId: farmerId.trim().toUpperCase(),
      farmerName: (farmerName || farmerId).trim(),
      farmerPhone: (farmerPhone || '').trim(),
      category: selectedCategory,
      subject: (subject || 'Farmer Query').trim(),
      description: (description || subject || '').trim(),
      language: selectedLanguage as any,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Prepend new query
    db.data.queries.unshift(newQuery);

    // Write to persistent lowdb
    await db.write();

    // Async sync to Supabase Cloud backup store
    syncQueriesToCloud(db.data.queries).catch((err) =>
      console.warn('[syncQueriesToCloud background error]:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Query submitted successfully! It is now visible on the Dairy Dashboard.',
      query: newQuery
    });
  } catch (err: any) {
    console.error('[API /api/farmer/query POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit query' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH: Admin updates query status & response notes
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { queryId, status, adminNotes, resolvedBy } = body;

    if (!queryId) {
      return NextResponse.json(
        { success: false, error: 'Query ID is required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    if (!db.data.queries) db.data.queries = [];

    const queryIndex = db.data.queries.findIndex((q) => q.id === queryId);
    if (queryIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Query #${queryId} not found.` },
        { status: 404 }
      );
    }

    const query = db.data.queries[queryIndex];
    const nowIso = new Date().toISOString();
    query.updatedAt = nowIso;

    if (status && ['pending', 'in_progress', 'resolved'].includes(status)) {
      query.status = status as QueryStatus;
      if (status === 'resolved') {
        query.resolvedAt = query.resolvedAt || nowIso;
        query.resolvedBy = resolvedBy || 'Dairy Administrator';
      }
    }

    if (typeof adminNotes === 'string') {
      query.adminNotes = adminNotes.trim();
    }

    db.data.queries[queryIndex] = query;

    await db.write();

    try {
      await syncQueriesToCloud(db.data.queries);
    } catch (syncErr) {
      console.warn('[syncQueriesToCloud PATCH warning]:', syncErr);
    }

    // Auto-notify the farmer with a direct notification about the dairy's update
    if (adminNotes && adminNotes.trim()) {
      try {
        const notifTitle = status === 'resolved' 
          ? `तक्रार निवारण: #${queryId} (Resolved)` 
          : `तक्रार अपडेट: #${queryId} (Dairy Update)`;
        await createNotification({
          type: 'announcement',
          title: notifTitle,
          body: adminNotes.trim(),
          farmerId: query.farmerId,
          branchId: 'ALL',
          sentBy: resolvedBy || 'Dairy Administrator'
        });
      } catch (err) {
        console.warn('[Auto Notification on Query Response Warning]', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Query #${queryId} updated successfully.`,
      query
    });
  } catch (err: any) {
    console.error('[API /api/farmer/query PATCH Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update query' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: Admin dismisses/deletes a query
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('queryId');

    if (!queryId) {
      return NextResponse.json(
        { success: false, error: 'Query ID is required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    if (!db.data.queries) db.data.queries = [];

    const initialLen = db.data.queries.length;
    db.data.queries = db.data.queries.filter((q) => q.id !== queryId);

    if (db.data.queries.length !== initialLen) {
      await db.write();
      syncQueriesToCloud(db.data.queries).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `Query #${queryId} deleted.`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete query' },
      { status: 500 }
    );
  }
}
