import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function checkAuth(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function GET(req: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { surveyId } = await params;
  const responses = await db.getResponses(surveyId);
  const responseIds = responses.map(r => r.id);
  const allAnswers = responseIds.length > 0 ? await db.getAnswersForResponses(responseIds) : [];

  const result = responses.map(r => ({
    ...r,
    answers: allAnswers.filter(a => a.response_id === r.id),
  }));

  return NextResponse.json(result);
}
