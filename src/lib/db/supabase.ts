import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DbInterface } from './interface';
import type { Survey, Question, SurveyResponse, Answer } from './types';

// Lazily initialized — avoids module-load crash when env vars aren't set yet
let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _client;
}

function assert<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data as T;
}

export const supabaseDb: DbInterface = {
  async getSurvey(id) {
    const { data, error } = await getClient()
      .from('surveys')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Survey | null;
  },

  async listSurveys() {
    const { data, error } = await getClient()
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: true });
    return assert(data, error) as Survey[];
  },

  async getQuestions(surveyId) {
    const { data, error } = await getClient()
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('display_order', { ascending: true });
    return assert(data, error) as Question[];
  },

  async getResponses(surveyId) {
    const { data, error } = await getClient()
      .from('responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });
    return assert(data, error) as SurveyResponse[];
  },

  async getAnswersForResponses(responseIds) {
    if (responseIds.length === 0) return [];
    const { data, error } = await getClient()
      .from('answers')
      .select('*')
      .in('response_id', responseIds);
    return assert(data, error) as Answer[];
  },

  async hasRecentResponse(surveyId, userId, withinHours = 24) {
    const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
    const { data, error } = await getClient()
      .from('responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('anonymous_user_id', userId)
      .gte('submitted_at', cutoff)
      .limit(1);
    if (error) throw new Error(error.message);
    return (data ?? []).length > 0;
  },

  async insertResponse(data) {
    const { data: row, error } = await getClient()
      .from('responses')
      .insert(data)
      .select()
      .single();
    return assert(row, error) as SurveyResponse;
  },

  async insertAnswers(answers) {
    const { error } = await getClient().from('answers').insert(answers);
    if (error) throw new Error(error.message);
  },

  async addQuestion(data) {
    const { data: row, error } = await getClient()
      .from('questions')
      .insert(data)
      .select()
      .single();
    return assert(row, error) as Question;
  },

  async deleteQuestion(id) {
    const { error } = await getClient().from('questions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
