import path from 'path';
import os from 'os';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { DbInterface } from './interface';
import type { Survey, Question, SurveyResponse, Answer } from './types';

// Default: ~/Documents/emoji-survey/survey-data.xlsx — persists across reboots
const DATA_PATH = process.env.EXCEL_DATA_PATH
  ? path.resolve(process.env.EXCEL_DATA_PATH)
  : path.join(os.homedir(), 'Documents', 'emoji-survey', 'survey-data.xlsx');

// ── helpers ──────────────────────────────────────────────────────────────────

function ensureDir() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readWorkbook(): XLSX.WorkBook {
  if (!fs.existsSync(DATA_PATH)) return createFreshWorkbook();
  return XLSX.readFile(DATA_PATH);
}

function writeWorkbook(wb: XLSX.WorkBook) {
  ensureDir();
  try {
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    fs.writeFileSync(DATA_PATH, buf);
  } catch (err) {
    throw new Error(`Failed to write Excel file at ${DATA_PATH}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function sheetToRows<T extends object>(wb: XLSX.WorkBook, name: string): T[] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<T>(ws, { defval: '' });
}

function rowsToSheet<T extends object>(rows: T[]): XLSX.WorkSheet {
  return XLSX.utils.json_to_sheet(rows);
}

function setSheet<T extends object>(wb: XLSX.WorkBook, name: string, rows: T[]) {
  wb.Sheets[name] = rowsToSheet(rows);
  if (!wb.SheetNames.includes(name)) wb.SheetNames.push(name);
}

function now() {
  return new Date().toISOString();
}

// ── seed ─────────────────────────────────────────────────────────────────────

function createFreshWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const surveyId = uuidv4();
  const surveys: Survey[] = [
    { id: surveyId, title: 'Special Olympics NC — Event Experience Survey', created_at: now() },
  ];

  const questions: Question[] = [
    { id: uuidv4(), survey_id: surveyId, text: 'How would you rate your overall experience at today\'s event?', display_order: 0 },
    { id: uuidv4(), survey_id: surveyId, text: 'How welcoming and inclusive did the event feel?', display_order: 1 },
    { id: uuidv4(), survey_id: surveyId, text: 'How satisfied were you with the organization and activities at the event?', display_order: 2 },
  ];

  setSheet(wb, 'Surveys', surveys);
  setSheet(wb, 'Questions', questions);
  setSheet(wb, 'Responses', [] as SurveyResponse[]);
  setSheet(wb, 'Answers', [] as Answer[]);

  writeWorkbook(wb);
  return wb;
}

// ── implementation ────────────────────────────────────────────────────────────

export const excelDb: DbInterface = {
  async getSurvey(id) {
    const wb = readWorkbook();
    const rows = sheetToRows<Survey>(wb, 'Surveys');
    return rows.find(s => s.id === id) ?? null;
  },

  async listSurveys() {
    const wb = readWorkbook();
    return sheetToRows<Survey>(wb, 'Surveys');
  },

  async getQuestions(surveyId) {
    const wb = readWorkbook();
    const rows = sheetToRows<Question>(wb, 'Questions');
    return rows
      .filter(q => q.survey_id === surveyId)
      .sort((a, b) => Number(a.display_order) - Number(b.display_order));
  },

  async getResponses(surveyId) {
    const wb = readWorkbook();
    const rows = sheetToRows<SurveyResponse>(wb, 'Responses');
    return rows.filter(r => r.survey_id === surveyId);
  },

  async getAnswersForResponses(responseIds) {
    const wb = readWorkbook();
    const rows = sheetToRows<Answer>(wb, 'Answers');
    const set = new Set(responseIds);
    return rows.filter(a => set.has(a.response_id));
  },

  async hasRecentResponse(surveyId, userId, withinHours = 24) {
    const wb = readWorkbook();
    const rows = sheetToRows<SurveyResponse>(wb, 'Responses');
    const cutoff = Date.now() - withinHours * 60 * 60 * 1000;
    return rows.some(
      r =>
        r.survey_id === surveyId &&
        r.anonymous_user_id === userId &&
        new Date(r.submitted_at).getTime() > cutoff,
    );
  },

  async insertResponse(data) {
    const wb = readWorkbook();
    const rows = sheetToRows<SurveyResponse>(wb, 'Responses');
    const row: SurveyResponse = { id: uuidv4(), submitted_at: now(), ...data };
    rows.push(row);
    setSheet(wb, 'Responses', rows);
    writeWorkbook(wb);
    return row;
  },

  async insertAnswers(answers) {
    const wb = readWorkbook();
    const rows = sheetToRows<Answer>(wb, 'Answers');
    for (const a of answers) rows.push({ id: uuidv4(), ...a });
    setSheet(wb, 'Answers', rows);
    writeWorkbook(wb);
  },

  async addQuestion(data) {
    const wb = readWorkbook();
    const rows = sheetToRows<Question>(wb, 'Questions');
    const row: Question = { id: uuidv4(), ...data };
    rows.push(row);
    setSheet(wb, 'Questions', rows);
    writeWorkbook(wb);
    return row;
  },

  async deleteQuestion(id) {
    const wb = readWorkbook();
    const rows = sheetToRows<Question>(wb, 'Questions').filter(q => q.id !== id);
    setSheet(wb, 'Questions', rows);
    writeWorkbook(wb);
  },
};
