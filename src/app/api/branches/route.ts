import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Branch } from '@/app/data';

export async function GET() {
  try {
    const db = await getDb();
    const actualBranches = (db.data.branches || []).filter(b => !b.id.startsWith('NOTIF-'));
    return NextResponse.json({ success: true, data: actualBranches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, manager, capacity, employees, status, x, y } = body;

    if (!name || !manager) {
      return NextResponse.json({ success: false, error: 'Branch name and manager name are required' }, { status: 400 });
    }

    const db = await getDb();
    const newId = `B-${(db.data.branches.length + 1).toString().padStart(2, '0')}`;
    const newBranch: Branch = {
      id: newId,
      name,
      manager,
      capacity: Number(capacity) || 10000,
      employees: Number(employees) || 5,
      todayCollection: 0,
      payments: 0,
      status: status || 'Active',
      x: Number(x) || 50,
      y: Number(y) || 50
    };

    db.data.branches.push(newBranch);
    await db.write();

    return NextResponse.json({ success: true, data: newBranch }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Branch ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const index = db.data.branches.findIndex(b => b.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
    }

    db.data.branches[index] = { ...db.data.branches[index], ...updates };
    await db.write();

    return NextResponse.json({ success: true, data: db.data.branches[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
