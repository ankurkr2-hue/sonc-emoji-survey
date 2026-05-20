'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const RED = '#CE1126';
const DARK = '#3D3D3D';

const EMOJIS: { value: number; emoji: string; label: string }[] = [
  { value: 5, emoji: '😍', label: 'Amazing' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '😕', label: 'Not great' },
  { value: 1, emoji: '😞', label: 'Poor' },
];

interface Question { id: string; text: string; display_order: number }
interface SurveyData { id: string; title: string; questions: Question[] }

function getUserId(): string {
  let id = localStorage.getItem('survey_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('survey_user_id', id); }
  return id;
}

function Header() {
  return (
    <div style={{ background: '#fff', borderBottom: `4px solid ${RED}`, padding: '20px 0', marginBottom: 32, textAlign: 'center' }}>
      <img src="/logo.png" alt="Special Olympics North Carolina" style={{ height: 90, objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />
    </div>
  );
}

export default function SurveyPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'done' | 'blocked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`/api/survey/${surveyId}`)
      .then(async r => {
        if (!r.ok) { const t = await r.text(); throw new Error(`HTTP ${r.status}: ${t}`); }
        return r.json() as Promise<SurveyData>;
      })
      .then(data => { setSurvey(data); setStatus('ready'); })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setStatus('error');
      });
  }, [surveyId]);

  function pickAnswer(questionId: string, value: number) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!survey) return;
    setStatus('submitting');
    const userId = getUserId();
    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        survey_id: surveyId,
        anonymous_user_id: userId,
        answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
      }),
    });
    if (res.status === 429) { setStatus('blocked'); return; }
    if (!res.ok) { setErrorMsg('Submission failed. Please try again.'); setStatus('error'); return; }
    setStatus('done');
  }

  if (status === 'loading') return (
    <>
      <Header />
      <div style={{ textAlign: 'center', padding: 48, color: '#777' }}>Loading survey…</div>
    </>
  );

  if (status === 'error') return (
    <>
      <Header />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        <div style={{ background: '#fff3f3', border: `1px solid ${RED}`, borderRadius: 8, padding: 20, color: RED }}>
          <strong>Error:</strong> {errorMsg || 'Could not load survey.'}
        </div>
      </div>
    </>
  );

  if (status === 'blocked') return (
    <>
      <Header />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: DARK, marginBottom: 8 }}>Already Submitted</h2>
          <p style={{ color: '#666' }}>You've already responded in the last 24 hours. Thank you!</p>
        </div>
      </div>
    </>
  );

  if (status === 'done') return (
    <>
      <Header />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 48, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: RED, fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Thank You!</h2>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.6 }}>
            Your feedback helps us make Special Olympics NC events even better.<br />
            We appreciate you sharing your experience!
          </p>
        </div>
      </div>
    </>
  );

  if (!survey) return null;

  const answered = survey.questions.filter(q => answers[q.id] !== undefined).length;
  const total = survey.questions.length;
  const allAnswered = answered === total;
  const progress = total > 0 ? (answered / total) * 100 : 0;

  return (
    <>
      <Header />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 48px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 4 }}>{survey.title}</h1>
        <p style={{ color: '#777', fontSize: 14, marginBottom: 24 }}>Please answer all questions below and tap Submit.</p>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#666' }}>
            <span>Progress</span>
            <span>{answered} of {total} answered</span>
          </div>
          <div style={{ height: 8, background: '#E0E0E0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: RED, borderRadius: 4, transition: 'width 0.25s ease' }} />
          </div>
        </div>

        {/* Questions */}
        {survey.questions.map((q, i) => {
          const selected = answers[q.id];
          return (
            <div key={q.id} style={{
              background: '#fff',
              borderRadius: 12,
              padding: '24px 20px',
              marginBottom: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: selected !== undefined ? `2px solid ${RED}` : '2px solid transparent',
              transition: 'border-color 0.2s',
            }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 18, lineHeight: 1.5 }}>
                <span style={{ color: RED, marginRight: 6 }}>{i + 1}.</span>{q.text}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {EMOJIS.map(({ value, emoji, label }) => {
                  const isSelected = selected === value;
                  return (
                    <button
                      key={value}
                      onClick={() => pickAnswer(q.id, value)}
                      title={label}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        background: isSelected ? '#FFF0F2' : '#F7F7F7',
                        border: `2px solid ${isSelected ? RED : '#E0E0E0'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        minWidth: 64,
                      }}
                    >
                      <span style={{ fontSize: 34, lineHeight: 1 }}>{emoji}</span>
                      <span style={{ fontSize: 11, color: isSelected ? RED : '#888', fontWeight: isSelected ? 700 : 400 }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          disabled={!allAnswered || status === 'submitting'}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 8,
            padding: '16px 0',
            background: allAnswered ? RED : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 17,
            fontWeight: 700,
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            letterSpacing: 0.3,
            transition: 'background 0.2s',
          }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    </>
  );
}
