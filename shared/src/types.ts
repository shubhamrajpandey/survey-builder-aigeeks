import { z } from 'zod';

export type QuestionType = 'text' | 'single_choice' | 'checkbox' | 'rating';

export type ConditionOperator = 'equals' | 'not_equals' | 'includes' | 'gt' | 'lt';

export interface Condition {
  questionId: string;
  operator: ConditionOperator;
  value: string | number;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
  condition?: Condition;
}

export type SurveyStatus = 'draft' | 'published' | 'closed';

export interface Survey {
  _id?: string;
  rootId?: string;
  version?: number;
  isLatest?: boolean;
  title: string;
  description?: string;
  questions: Question[];
  status?: SurveyStatus;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type AnswerValue = string | number | string[];

export type AnswersMap = Record<string, AnswerValue>;

export interface SubmitResponsePayload {
  answers: AnswersMap;
  website?: string; // honeypot field
}

export interface StoredResponse {
  _id?: string;
  surveyId: string;
  rootId: string;
  version: number;
  answers: AnswersMap;
  submittedAt: string | Date;
  meta?: {
    ipHash?: string;
  };
}

export interface SingleChoiceQuestionAnalytics {
  questionId: string;
  type: 'single_choice';
  label: string;
  answered: number;
  counts: Array<{ option: string; count: number }>;
}

export interface CheckboxQuestionAnalytics {
  questionId: string;
  type: 'checkbox';
  label: string;
  answered: number;
  counts: Array<{ option: string; count: number }>;
}

export interface RatingQuestionAnalytics {
  questionId: string;
  type: 'rating';
  label: string;
  answered: number;
  average: number | null;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface TextQuestionAnalytics {
  questionId: string;
  type: 'text';
  label: string;
  answered: number;
  answers: string[];
  hasMore: boolean;
}

export type QuestionAnalytics =
  | SingleChoiceQuestionAnalytics
  | CheckboxQuestionAnalytics
  | RatingQuestionAnalytics
  | TextQuestionAnalytics;

export interface SurveyAnalyticsResponse {
  surveyId: string;
  rootId?: string;
  version: number | 'all';
  totalResponses: number;
  questions: QuestionAnalytics[];
}
