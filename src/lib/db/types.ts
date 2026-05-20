export interface Survey {
  id: string;
  title: string;
  created_at: string;
}

export interface Question {
  id: string;
  survey_id: string;
  text: string;
  display_order: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  anonymous_user_id: string;
  role: string;
  score: number;
  submitted_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  value: number;
}
