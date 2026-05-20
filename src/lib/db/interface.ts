import type { Survey, Question, SurveyResponse, Answer } from './types';

export interface DbInterface {
  getSurvey(id: string): Promise<Survey | null>;
  listSurveys(): Promise<Survey[]>;
  getQuestions(surveyId: string): Promise<Question[]>;
  getResponses(surveyId: string): Promise<SurveyResponse[]>;
  getAnswersForResponses(responseIds: string[]): Promise<Answer[]>;
  hasRecentResponse(surveyId: string, userId: string, withinHours?: number): Promise<boolean>;
  insertResponse(data: { survey_id: string; anonymous_user_id: string; role: string; feedback: string; score: number }): Promise<SurveyResponse>;
  insertAnswers(answers: { response_id: string; question_id: string; value: number }[]): Promise<void>;
  addQuestion(data: { survey_id: string; text: string; display_order: number }): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
}
