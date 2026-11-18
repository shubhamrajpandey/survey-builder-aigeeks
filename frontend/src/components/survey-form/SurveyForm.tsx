import React, { useState, useMemo, useCallback } from 'react';
import { Survey, Question, isQuestionVisible, validateResponse, AnswersMap, AnswerValue } from '@survey/shared';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '../ui/Button';
import { Send, Eye, CheckCircle2 } from 'lucide-react';

interface SurveyFormProps {
  survey: Survey;
  onSubmit?: (answers: AnswersMap, honeypot?: string) => Promise<void>;
  isPreview?: boolean;
  isSubmitting?: boolean;
}

export function SurveyForm({
  survey,
  onSubmit,
  isPreview = false,
  isSubmitting = false,
}: SurveyFormProps) {
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [honeypot, setHoneypot] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Map of questions for O(1) lookup in condition checking
  const questionsById = useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of survey.questions || []) {
      map.set(q.id, q);
    }
    return map;
  }, [survey.questions]);

  // Compute currently visible questions in survey order
  const visibleQuestions = useMemo(() => {
    return (survey.questions || []).filter((q) => isQuestionVisible(q, answers, questionsById));
  }, [survey.questions, answers, questionsById]);

  // Handle answer change with automatic dropping of hidden questions
  const handleAnswerChange = useCallback(
    (questionId: string, val: AnswerValue | undefined) => {
      setAnswers((prev) => {
        const next: AnswersMap = { ...prev };
        if (val === undefined) {
          delete next[questionId];
        } else {
          next[questionId] = val;
        }

        // Evaluate question visibility with new answers and drop any answers that become hidden
        const cleaned: AnswersMap = { ...next };
        for (const q of survey.questions || []) {
          const visible = isQuestionVisible(q, cleaned, questionsById);
          if (!visible && cleaned[q.id] !== undefined) {
            delete cleaned[q.id];
          }
        }
        return cleaned;
      });

      // Clear error for this question when changed
      setErrors((prev) => {
        if (!prev[questionId]) return prev;
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    },
    [survey.questions, questionsById]
  );

  // Calculate progress
  const answeredCount = useMemo(() => {
    return visibleQuestions.filter((q) => {
      const val = answers[q.id];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'number') return true;
      return false;
    }).length;
  }, [visibleQuestions, answers]);

  const progressPct =
    visibleQuestions.length > 0 ? Math.round((answeredCount / visibleQuestions.length) * 100) : 0;

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use single source of truth validateResponse from @survey/shared
    const validation = validateResponse(survey, answers);

    if (!validation.ok) {
      setErrors(validation.errors);

      // Scroll to and focus the first invalid question
      const firstErrorId = visibleQuestions.find((q) => validation.errors[q.id])?.id;
      if (firstErrorId) {
        const elem = document.getElementById(`question-wrapper-${firstErrorId}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          elem.focus();
        }
      }
      return;
    }

    if (isPreview) {
      alert('Validation passed! Submissions are disabled in Preview mode.');
      return;
    }

    if (onSubmit) {
      await onSubmit(validation.cleanedAnswers, honeypot);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Preview mode notice */}
      {isPreview && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-medium rounded-xl">
          <Eye className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Interactive Preview: Test live conditional logic and validations. Submissions are disabled.</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span>Progress</span>
          <span className="text-brand-600">
            {answeredCount} of {visibleQuestions.length} answered ({progressPct}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Honeypot field (hidden from screen, accessible only to spambots) */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="hp_website">Leave this field blank</label>
        <input
          type="text"
          id="hp_website"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Visible Questions List */}
      <div className="space-y-5">
        {visibleQuestions.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            No questions available.
          </div>
        ) : (
          visibleQuestions.map((question, idx) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              index={idx}
              value={answers[question.id]}
              onChange={(val) => handleAnswerChange(question.id, val)}
              error={errors[question.id]}
              disabled={isSubmitting}
            />
          ))
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          leftIcon={isPreview ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          className="w-full sm:w-auto"
        >
          {isPreview ? 'Validate Responses' : 'Submit Response'}
        </Button>
      </div>
    </form>
  );
}
