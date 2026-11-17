import React, { useMemo } from 'react';
import { Condition, ConditionOperator, Question } from '@survey/shared';
import { Select } from '../ui/Select';
import { GitBranch, AlertTriangle } from 'lucide-react';

interface ConditionEditorProps {
  condition?: Condition;
  onChange: (condition?: Condition) => void;
  earlierQuestions: Question[];
  allQuestions: Question[];
  currentQuestionId: string;
  disabled?: boolean;
}

const OPERATORS_BY_TYPE: Record<string, Array<{ label: string; value: ConditionOperator }>> = {
  single_choice: [
    { label: 'equals', value: 'equals' },
    { label: 'not equals', value: 'not_equals' },
  ],
  text: [
    { label: 'equals', value: 'equals' },
    { label: 'not equals', value: 'not_equals' },
  ],
  checkbox: [{ label: 'includes', value: 'includes' }],
  rating: [
    { label: 'equals', value: 'equals' },
    { label: 'not equals', value: 'not_equals' },
    { label: 'greater than', value: 'gt' },
    { label: 'less than', value: 'lt' },
  ],
};

export function ConditionEditor({
  condition,
  onChange,
  earlierQuestions,
  allQuestions,
  disabled = false,
}: ConditionEditorProps) {
  const isEnabled = !!condition;

  // Check if current condition references a question that appears later or doesn't exist
  const conditionWarning = useMemo(() => {
    if (!condition) return null;
    const targetInEarlier = earlierQuestions.find((q) => q.id === condition.questionId);
    if (targetInEarlier) return null;

    const targetInLater = allQuestions.find((q) => q.id === condition.questionId);
    if (targetInLater) {
      return `Target question '${targetInLater.label}' now appears after this question. Conditions can only depend on earlier questions.`;
    }
    return `Referenced question '${condition.questionId}' does not exist.`;
  }, [condition, earlierQuestions, allQuestions]);

  const targetQuestion = earlierQuestions.find((q) => q.id === condition?.questionId);
  const allowedOperators = targetQuestion
    ? OPERATORS_BY_TYPE[targetQuestion.type] || []
    : [];

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      onChange(undefined);
      return;
    }

    if (earlierQuestions.length === 0) {
      alert('You must have at least one question appearing before this one to create a condition.');
      return;
    }

    // Default to first earlier question
    const defaultTarget = earlierQuestions[0];
    const defaultOp = OPERATORS_BY_TYPE[defaultTarget.type]?.[0]?.value || 'equals';
    const defaultValue =
      defaultTarget.type === 'single_choice' || defaultTarget.type === 'checkbox'
        ? defaultTarget.options?.[0] || ''
        : defaultTarget.type === 'rating'
        ? 5
        : 'Yes';

    onChange({
      questionId: defaultTarget.id,
      operator: defaultOp,
      value: defaultValue,
    });
  };

  const handleTargetChange = (targetId: string) => {
    const newTarget = earlierQuestions.find((q) => q.id === targetId);
    if (!newTarget) return;

    const defaultOp = OPERATORS_BY_TYPE[newTarget.type]?.[0]?.value || 'equals';
    const defaultValue =
      newTarget.type === 'single_choice' || newTarget.type === 'checkbox'
        ? newTarget.options?.[0] || ''
        : newTarget.type === 'rating'
        ? 5
        : '';

    onChange({
      questionId: newTarget.id,
      operator: defaultOp,
      value: defaultValue,
    });
  };

  const handleOperatorChange = (op: ConditionOperator) => {
    if (!condition) return;
    onChange({ ...condition, operator: op });
  };

  const handleValueChange = (val: string | number) => {
    if (!condition) return;
    onChange({ ...condition, value: val });
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isEnabled}
            disabled={disabled || earlierQuestions.length === 0}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer disabled:opacity-50"
          />
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <GitBranch className="w-3.5 h-3.5 text-brand-600" />
            Show only conditionally...
          </span>
        </label>
        {earlierQuestions.length === 0 && (
          <span className="text-2xs text-slate-400 italic">
            Requires at least one preceding question
          </span>
        )}
      </div>

      {conditionWarning && (
        <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Invalid Condition Order</p>
            <p className="mt-0.5">{conditionWarning}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs font-semibold underline hover:text-rose-900"
          >
            Clear
          </button>
        </div>
      )}

      {isEnabled && condition && (
        <div className="mt-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
          <p className="text-xs font-medium text-slate-500">
            This question will only be visible if:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Earlier Question Select */}
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">
                Parent Question
              </label>
              <Select
                value={condition.questionId}
                disabled={disabled}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="text-xs py-1.5"
              >
                {earlierQuestions.map((q, idx) => (
                  <option key={q.id} value={q.id}>
                    Q{idx + 1}: {q.label.slice(0, 30)}
                    {q.label.length > 30 ? '...' : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Operator Select */}
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">Operator</label>
              <Select
                value={condition.operator}
                disabled={disabled || allowedOperators.length === 0}
                onChange={(e) => handleOperatorChange(e.target.value as ConditionOperator)}
                className="text-xs py-1.5"
              >
                {allowedOperators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">Value</label>
              {targetQuestion?.type === 'single_choice' || targetQuestion?.type === 'checkbox' ? (
                <Select
                  value={String(condition.value)}
                  disabled={disabled}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="text-xs py-1.5"
                >
                  {(targetQuestion.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              ) : targetQuestion?.type === 'rating' ? (
                <Select
                  value={Number(condition.value)}
                  disabled={disabled}
                  onChange={(e) => handleValueChange(parseInt(e.target.value, 10))}
                  className="text-xs py-1.5"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Star' : 'Stars'}
                    </option>
                  ))}
                </Select>
              ) : (
                <input
                  type="text"
                  value={String(condition.value)}
                  disabled={disabled}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Expected text answer"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
