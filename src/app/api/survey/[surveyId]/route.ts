import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  const { surveyId } = await params;
  const survey = await db.getSurvey(surveyId);
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const questions = await db.getQuestions(surveyId);
  return NextResponse.json({ ...survey, questions });
}
