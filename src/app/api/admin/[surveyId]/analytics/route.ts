import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const EMOJIS: Record<number, string> = { 5: '😍', 4: '😊', 3: '😐', 2: '😕', 1: '😞' };

function checkAuth(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function GET(req: Request, { params }: { params: Promise<{ surveyId: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { surveyId } = await params;
  const responses = await db.getResponses(surveyId);
  const questions = await db.getQuestions(surveyId);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = responses.filter(r => new Date(r.submitted_at).getTime() > sevenDaysAgo).length;

  const avgScore = responses.length > 0
    ? Math.round(responses.reduce((a, r) => a + Number(r.score), 0) / responses.length)
    : 0;

  const responseIds = responses.map(r => r.id);
  const allAnswers = responseIds.length > 0 ? await db.getAnswersForResponses(responseIds) : [];

  const questionStats = questions.map(q => {
    const qAnswers = allAnswers.filter(a => a.question_id === q.id);
    const distribution = [5, 4, 3, 2, 1].map(v => {
      const count = qAnswers.filter(a => Number(a.value) === v).length;
      const percent = qAnswers.length > 0 ? Math.round((count / qAnswers.length) * 100) : 0;
      return { value: v, emoji: EMOJIS[v], count, percent };
    });
    return { id: q.id, text: q.text, distribution };
  });

  return NextResponse.json({
    total_responses: responses.length,
    average_score: avgScore,
    responses_last_7_days: recentCount,
    questions: questionStats,
  });
}
