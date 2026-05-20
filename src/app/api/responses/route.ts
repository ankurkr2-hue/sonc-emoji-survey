import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface AnswerInput { question_id: string; value: number }
interface RequestBody {
  survey_id: string;
  anonymous_user_id: string;
  role: string;
  answers: AnswerInput[];
}

export async function POST(req: Request) {
  const body = await req.json() as RequestBody;
  const { survey_id, anonymous_user_id, role, answers } = body;

  if (!survey_id || !anonymous_user_id || !role || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const questions = await db.getQuestions(survey_id);
  if (questions.length === 0) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });

  const sum = answers.reduce((acc, a) => acc + a.value, 0);
  const max = questions.length * 5;
  const score = Math.round((sum / max) * 100);

  try {
    const response = await db.insertResponse({ survey_id, anonymous_user_id, role, score });
    await db.insertAnswers(
      answers.map(a => ({ response_id: response.id, question_id: a.question_id, value: a.value })),
    );
    return NextResponse.json({ score, response_id: response.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('insertResponse error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
