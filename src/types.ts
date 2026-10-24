export type QuestionType =
  | 'multiple_choice'
  | 'single_choice'
  | 'text'
  | 'yes_no'
  | 'rating'
  | 'dropdown';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface QuestionOption {
  id?: number;
  option_text: string;
  display_order?: number;
}

export interface Question {
  id?: number;
  survey_id?: number;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  display_order: number;
  help_text?: string;
  options?: string[];
}

export interface Survey {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
  question_count?: number;
  response_count?: number;
  last_response_at?: string;
}

export interface SurveyWithQuestions {
  survey: Survey;
  questions: Question[];
  stats?: {
    totalResponses: number;
    avgCompletionSeconds: number;
  };
}

export interface QuestionAnalytics {
  id: number;
  question_text: string;
  question_type: QuestionType;
  is_required: number;
  display_order: number;
  help_text?: string;
  totalAnswers: number;
  averageRating?: number;
  distribution?: Record<number, number>;
  breakdown?: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  textResponses?: Array<{
    id: number;
    text: string;
    date: string;
  }>;
}

export interface SurveyResults {
  survey: Survey;
  summary: {
    totalResponses: number;
    avgCompletionSeconds: number;
  };
  questions: QuestionAnalytics[];
}

export interface IndividualResponse {
  id: number;
  respondent_identifier: string;
  submission_date: string;
  completion_seconds: number;
  answers: Record<number, string>;
}

export interface SurveyTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  questions: Array<{
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    help_text?: string;
    options?: string[];
  }>;
}
