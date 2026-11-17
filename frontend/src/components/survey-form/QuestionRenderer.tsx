import React from 'react';
import { Question } from '@survey/shared';
import { Textarea } from '../ui/Textarea';
import { RatingInput } from './RatingInput';

interface QuestionRendererProps {
  question: Question;
  index: number;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  disabled?: boolean;
}

export function QuestionRenderer({
  question,
  index,
  value,
  onChange,
  error,
  disabled = false,
}: QuestionRendererProps) {
  const qId = question.id;

  return (
    <div
      id={`question-wrapper-${qId}`}
      tabIndex={-1}
      className={`p-5 sm:p-6 rounded-xl border bg-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
        error
          ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/10'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1">
          <label htmlFor={`input-${qId}`} className="block text-base font-semibold text-slate-900 leading-snug">
            {question.label}
            {question.required && <span className="text-rose-500 ml-1.5" title="Required">*</span>}
          </label>
        </div>
      </div>

      <div className="pl-9">
        {question.type === 'text' && (
          <Textarea
            id={`input-${qId}`}
            placeholder="Type your answer here..."
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
            maxLength={2000}
            className="w-full text-base"
          />
        )}

        {question.type === 'single_choice' && (
          <div className="space-y-2.5" role="radiogroup" aria-labelledby={`question-wrapper-${qId}`}>
            {(question.options || []).map((option, optIdx) => {
              const optId = `${qId}-opt-${optIdx}`;
              const isChecked = value === option;

              return (
                <label
                  key={option}
                  htmlFor={optId}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer select-none ${
                    isChecked
                      ? 'border-brand-500 bg-brand-50/60 text-brand-900 ring-1 ring-brand-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    id={optId}
                    name={qId}
                    value={option}
                    checked={isChecked}
                    disabled={disabled}
                    onChange={() => onChange(option)}
                    className="w-4 h-4 text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'checkbox' && (
          <div className="space-y-2.5" role="group" aria-labelledby={`question-wrapper-${qId}`}>
            {(question.options || []).map((option, optIdx) => {
              const optId = `${qId}-opt-${optIdx}`;
              const currentArr: string[] = Array.isArray(value) ? value : [];
              const isChecked = currentArr.includes(option);

              const handleCheckboxChange = () => {
                if (isChecked) {
                  onChange(currentArr.filter((item) => item !== option));
                } else {
                  onChange([...currentArr, option]);
                }
              };

              return (
                <label
                  key={option}
                  htmlFor={optId}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer select-none ${
                    isChecked
                      ? 'border-brand-500 bg-brand-50/60 text-brand-900 ring-1 ring-brand-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    id={optId}
                    name={qId}
                    value={option}
                    checked={isChecked}
                    disabled={disabled}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'rating' && (
          <div className="pt-1 pb-2">
            <RatingInput
              id={`input-${qId}`}
              value={typeof value === 'number' ? value : undefined}
              onChange={(val) => onChange(val)}
              disabled={disabled}
            />
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <span>⚠️ {error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
