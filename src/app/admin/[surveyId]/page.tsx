'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';

const RED = '#CE1126';
const DARK = '#3D3D3D';

const EMOJI_META: { value: number; emoji: string; label: string; color: string }[] = [
  { value: 5, emoji: '😍', label: 'Amazing',   color: '#2E7D32' },
  { value: 4, emoji: '😊', label: 'Good',       color: '#558B2F' },
  { value: 3, emoji: '😐', label: 'Okay',       color: '#F9A825' },
  { value: 2, emoji: '😕', label: 'Not great',  color: '#E65100' },
  { value: 1, emoji: '😞', label: 'Poor',       color: '#B71C1C' },
];

interface Distribution { value: number; emoji: string; count: number; percent: number }
interface QuestionStat { id: string; text: string; distribution: Distribution[] }
interface Analytics {
  total_responses: number;
  average_score: number;
  responses_last_7_days: number;
  questions: QuestionStat[];
}
interface AnswerRow { question_id: string; value: number }
interface ResponseRow {
  id: string;
  anonymous_user_id: string;
  role: string;
  feedback: string;
  submitted_at: string;
  score: number;
  answers: AnswerRow[];
}

function AdminHeader() {
  return (
    <div style={{ background: '#fff', borderBottom: '4px solid #CE1126', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <img src="/logo.png" alt="Special Olympics NC" style={{ height: 60, objectFit: 'contain' }} />
      <div>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>Admin Dashboard</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#3D3D3D' }}>Special Olympics NC — Survey Results</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', flex: 1, minWidth: 160, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '4px solid #CE1126' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#3D3D3D' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function DistributionBar({ dist, totalResponses }: { dist: Distribution[]; totalResponses: number }) {
  if (totalResponses === 0) return <p style={{ color: '#aaa', fontSize: 13 }}>No responses yet.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {dist.map(d => {
        const meta = EMOJI_META.find(m => m.value === d.value)!;
        return (
          <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{meta.emoji}</span>
            <span style={{ width: 72, fontSize: 12, color: '#555' }}>{meta.label}</span>
            <div style={{ flex: 1, background: '#F0F0F0', borderRadius: 4, height: 20, overflow: 'hidden' }}>
              <div style={{ width: d.percent + '%', height: '100%', background: meta.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ width: 56, fontSize: 12, color: '#555', textAlign: 'right' }}>
              {d.count} <span style={{ color: '#aaa' }}>({d.percent}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: (s: string) => void }) {
  const [input, setInput] = useState('');
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminHeader />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, boxShadow: '0 2px 16px rgba(0,0,0,0.10)', minWidth: 320, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#3D3D3D', marginBottom: 20, fontWeight: 700 }}>Admin Access</h2>
          <input
            type="password"
            placeholder="Enter password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && input && onLogin(input)}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginBottom: 12 }}
          />
          <button
            onClick={() => input && onLogin(input)}
            style={{ width: '100%', padding: '12px 0', background: '#CE1126', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [secret, setSecret] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loadError, setLoadError] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_secret');
    if (stored) setSecret(stored);
  }, []);

  const loadData = useCallback(async (s: string) => {
    const headers = { 'x-admin-secret': s };
    const [aRes, rRes] = await Promise.all([
      fetch('/api/admin/' + surveyId + '/analytics', { headers }),
      fetch('/api/admin/' + surveyId + '/responses', { headers }),
    ]);
    if (aRes.status === 401) {
      sessionStorage.removeItem('admin_secret');
      setSecret(null);
      setLoadError('Incorrect password.');
      return;
    }
    setAnalytics(await aRes.json() as Analytics);
    setResponses(await rRes.json() as ResponseRow[]);
  }, [surveyId]);

  useEffect(() => { if (secret) loadData(secret); }, [secret, loadData]);

  function handleLogin(s: string) {
    sessionStorage.setItem('admin_secret', s);
    setSecret(s);
  }

  function exportCsv() {
    if (!analytics) return;
    const qIds = analytics.questions.map(q => q.id);
    const qTexts = analytics.questions.map(q => q.text);
    const header = ['User ID', 'Role', 'Submitted At', 'Score', ...qTexts, 'Open Feedback'];
    const rows = responses.map(r => {
      const vals = qIds.map(qid => {
        const a = r.answers.find(a => a.question_id === qid);
        if (!a) return '';
        const m = EMOJI_META.find(m => m.value === Number(a.value));
        return m ? (m.emoji + ' ' + m.value + ' - ' + m.label) : a.value;
      });
      return [r.anonymous_user_id, r.role || '', new Date(r.submitted_at).toLocaleString(), r.score, ...vals, r.feedback || ''];
    });
    const csv = [header, ...rows].map(row => row.map(c => '"' + c + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sonc-survey-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addQuestion() {
    if (!newQuestion.trim() || !secret) return;
    setAdding(true);
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ survey_id: surveyId, text: newQuestion.trim() }),
    });
    setNewQuestion('');
    setAdding(false);
    await loadData(secret);
  }

  async function deleteQuestion(id: string) {
    if (!secret || !confirm('Delete this question? This cannot be undone.')) return;
    await fetch('/api/questions/' + id, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
    await loadData(secret);
  }

  if (!secret) return <AdminLogin onLogin={handleLogin} />;

  if (!analytics) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminHeader />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
        {loadError || 'Loading…'}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F4' }}>
      <AdminHeader />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <StatCard label="Total Responses" value={analytics.total_responses} />
          <StatCard label="Average Score" value={analytics.average_score + '/100'} sub="Based on emoji selections" />
          <StatCard label="Last 7 Days" value={analytics.responses_last_7_days} sub="Recent responses" />
        </div>

        {/* QR Code + survey link */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', padding: 12, border: '1px solid #eee', borderRadius: 8, display: 'inline-block' }}>
            <QRCode value={typeof window !== 'undefined' ? window.location.origin + '/survey/' + surveyId : ''} size={120} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Participant Survey Link</div>
            <div style={{ fontSize: 14, color: '#555', marginBottom: 12, wordBreak: 'break-all' }}>
              {typeof window !== 'undefined' ? window.location.origin + '/survey/' + surveyId : ''}
            </div>
            <div style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>
              Show this QR code on a screen or print it.<br />
              Participants scan with their phone camera to open the survey.
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid #eee' }}>Question Breakdown</h2>
          {analytics.questions.length === 0 && <p style={{ color: '#aaa', fontSize: 14 }}>No questions yet.</p>}
          {analytics.questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 28, paddingBottom: 24, borderBottom: i < analytics.questions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: DARK, flex: 1, lineHeight: 1.5 }}>
                  <span style={{ color: RED, marginRight: 6 }}>{i + 1}.</span>{q.text}
                </p>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  style={{ marginLeft: 16, background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#999', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Delete
                </button>
              </div>
              <DistributionBar dist={q.distribution} totalResponses={analytics.total_responses} />
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 16 }}>Add Question</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="Enter new question…"
              onKeyDown={e => e.key === 'Enter' && !adding && addQuestion()}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
            />
            <button
              onClick={addQuestion}
              disabled={adding || !newQuestion.trim()}
              style={{ padding: '10px 20px', background: newQuestion.trim() ? RED : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: newQuestion.trim() ? 'pointer' : 'not-allowed' }}
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: DARK }}>All Responses</h2>
            <button
              onClick={exportCsv}
              style={{ padding: '8px 18px', background: DARK, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Export CSV
            </button>
          </div>

          {responses.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No responses yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8F8F8', borderBottom: '2px solid #E8E8E8' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>Submitted</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#555', fontWeight: 600 }}>Score</th>
                    {analytics.questions.map((q, i) => (
                      <th key={q.id} style={{ padding: '10px 12px', textAlign: 'center', color: '#555', fontWeight: 600, minWidth: 80 }}>Q{i + 1}</th>
                    ))}
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: 600 }}>Feedback</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: 600, fontSize: 11 }}>User</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, idx) => (
                    <tr key={r.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '10px 12px', color: '#444', whiteSpace: 'nowrap' }}>
                        {new Date(r.submitted_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#F0F0F0', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600, color: DARK, whiteSpace: 'nowrap' }}>
                          {r.role || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          background: Number(r.score) >= 70 ? '#E8F5E9' : Number(r.score) >= 40 ? '#FFF9C4' : '#FFEBEE',
                          color: Number(r.score) >= 70 ? '#2E7D32' : Number(r.score) >= 40 ? '#F57F17' : '#B71C1C',
                          borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: 12,
                        }}>
                          {r.score}
                        </span>
                      </td>
                      {analytics.questions.map(q => {
                        const a = r.answers.find(a => a.question_id === q.id);
                        const m = a ? EMOJI_META.find(m => m.value === Number(a.value)) : null;
                        return (
                          <td key={q.id} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 20 }}>
                            {m ? <span title={m.label}>{m.emoji}</span> : <span style={{ color: '#ccc' }}>—</span>}
                          </td>
                        );
                      })}
                      <td style={{ padding: '10px 12px', color: '#555', fontSize: 12, maxWidth: 200 }}>
                        {r.feedback || <span style={{ color: '#ccc' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#aaa', fontFamily: 'monospace', fontSize: 10 }}>
                        {r.anonymous_user_id.slice(0, 8)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
