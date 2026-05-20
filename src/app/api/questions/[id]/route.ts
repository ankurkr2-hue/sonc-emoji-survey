import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function checkAuth(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await db.deleteQuestion(id);
  return NextResponse.json({ deleted: true });
}
