import { z } from 'zod';

export const QuestionTypeSchema = z.enum(['text', 'single_choice', 'checkbox', 'rating']);

export const ConditionOperatorSchema = z.enum(['equals', 'not_equals', 'includes', 'gt', 'lt']);

export const ConditionSchema = z.object({
  questionId: z.string().min(1, 'Target question ID is required'),
  operator: ConditionOperatorSchema,
  value: z.union([z.string(), z.number()]),
});

export const QuestionSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Question ID is required')
    .max(100, 'Question ID cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Question ID can only contain letters, numbers, hyphens, and underscores'),
  type: QuestionTypeSchema,
  label: z.string().trim().min(1, 'Question label cannot be empty').max(500, 'Label cannot exceed 500 characters'),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1, 'Option cannot be empty').max(200, 'Option cannot exceed 200 characters')).optional(),
  condition: ConditionSchema.optional(),
});

export const SurveyStatusSchema = z.enum(['draft', 'published', 'closed']);

export const AnswerValueSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
]);

export const CreateSurveySchema = z.object({
  title: z.string().trim().min(1, 'Survey title cannot be empty').max(200, 'Survey title cannot exceed 200 characters'),
  description: z.string().trim().max(2000, 'Survey description cannot exceed 2000 characters').optional().default(''),
  questions: z.array(QuestionSchema).min(1, 'Survey must contain at least one question').max(100, 'Survey cannot exceed 100 questions'),
  status: SurveyStatusSchema.optional().default('draft'),
});

export const UpdateSurveySchema = z.object({
  title: z.string().trim().min(1, 'Survey title cannot be empty').max(200, 'Survey title cannot exceed 200 characters').optional(),
  description: z.string().trim().max(2000, 'Survey description cannot exceed 2000 characters').optional(),
  questions: z.array(QuestionSchema).min(1, 'Survey must contain at least one question').max(100, 'Survey cannot exceed 100 questions').optional(),
  status: SurveyStatusSchema.optional(),
});

export const UpdateSurveyStatusSchema = z.object({
  status: SurveyStatusSchema,
});

export const SubmitResponsePayloadSchema = z.object({
  answers: z.record(AnswerValueSchema),
  website: z.string().optional(),
});
