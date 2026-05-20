import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function checkAuth(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { survey_id: string; text: string };
  const questions = await db.getQuestions(body.survey_id);
  const display_order = questions.length;

  const q = await db.addQuestion({ survey_id: body.survey_id, text: body.text, display_order });
  return NextResponse.json(q, { status: 201 });
}
