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

const ROLES = [
  { value: 'Athlete',          icon: '🏅' },
  { value: 'Volunteer',        icon: '🤝' },
  { value: 'Unified Partner',  icon: '👥' },
  { value: 'Other',            icon: '✏️' },
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
  const [role, setRole] = useState('');
  const [otherText, setOtherText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(5);

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

  const finalRole = role === 'Other' ? (otherText.trim() || 'Other') : role;
  const roleReady = role !== '' && (role !== 'Other' || otherText.trim() !== '');
  const answeredCount = survey ? survey.questions.filter(q => answers[q.id] !== undefined).length : 0;
  const totalSteps = survey ? survey.questions.length + 1 : 1; // +1 for role
  const completedSteps = (roleReady ? 1 : 0) + answeredCount;
  const allAnswered = survey ? roleReady && answeredCount === survey.questions.length : false;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

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
        role: finalRole,
        feedback,
        answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
      }),
    });
    if (!res.ok) { setErrorMsg('Submission failed. Please try again.'); setStatus('error'); return; }
    setStatus('done');
    setTimeout(() => window.location.reload(), 5000);
    let c = 5;
    const iv = setInterval(() => { c--; setCountdown(c); if (c <= 0) clearInterval(iv); }, 1000);
  }

  if (status === 'loading') return (
    <><Header /><div style={{ textAlign: 'center', padding: 48, color: '#777' }}>Loading…</div></>
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
          <p style={{ marginTop: 24, color: '#aaa', fontSize: 14 }}>
            Resetting for next participant in <strong style={{ color: DARK }}>{countdown}</strong>s…
          </p>
        </div>
      </div>
    </>
  );

  if (!survey) return null;

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
            <span>{completedSteps} of {totalSteps} answered</span>
          </div>
          <div style={{ height: 8, background: '#E0E0E0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: RED, borderRadius: 4, transition: 'width 0.25s ease' }} />
          </div>
        </div>

        {/* Role question — always first */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '24px 20px',
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: roleReady ? `2px solid ${RED}` : '2px solid transparent',
          transition: 'border-color 0.2s',
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 18, lineHeight: 1.5 }}>
            <span style={{ color: RED, marginRight: 6 }}>1.</span>What is your role at today's event?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ROLES.map(({ value, icon }) => {
              const isSelected = role === value;
              return (
                <button
                  key={value}
                  onClick={() => { setRole(value); if (value !== 'Other') setOtherText(''); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 16px',
                    background: isSelected ? '#FFF0F2' : '#F7F7F7',
                    border: `2px solid ${isSelected ? RED : '#E0E0E0'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 400, color: isSelected ? RED : DARK }}>
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
          {role === 'Other' && (
            <input
              autoFocus
              type="text"
              placeholder="Please describe your role…"
              value={otherText}
              onChange={e => setOtherText(e.target.value)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 14px',
                border: `2px solid ${RED}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* Emoji questions */}
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
                <span style={{ color: RED, marginRight: 6 }}>{i + 2}.</span>{q.text}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {EMOJIS.map(({ value, emoji, label }) => {
                  const isSelected = selected === value;
                  return (
                    <button
                      key={value}
                      onClick={() => pickAnswer(q.id, value)}
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

        {/* Open feedback — optional, always last */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '24px 20px',
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: feedback.trim() ? `2px solid ${RED}` : '2px solid transparent',
          transition: 'border-color 0.2s',
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 14, lineHeight: 1.5 }}>
            <span style={{ color: RED, marginRight: 6 }}>{survey.questions.length + 2}.</span>
            Any other feedback for us? <span style={{ color: '#aaa', fontWeight: 400, fontSize: 13 }}>(optional)</span>
          </p>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Share anything else about your experience today…"
            rows={4}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: `2px solid ${feedback.trim() ? RED : '#E0E0E0'}`,
              borderRadius: 10,
              fontSize: 14,
              color: DARK,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit',
            }}
          />
        </div>

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
