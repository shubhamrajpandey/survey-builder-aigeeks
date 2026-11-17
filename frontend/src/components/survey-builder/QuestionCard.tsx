import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question, QuestionType } from '@survey/shared';
import { GripVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Select } from '../ui/Select';
import { QuestionOptionsEditor } from './QuestionOptionsEditor';
import { ConditionEditor } from './ConditionEditor';

interface QuestionCardProps {
  question: Question;
  index: number;
  totalQuestions: number;
  onUpdate: (updated: Question) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  earlierQuestions: Question[];
  allQuestions: Question[];
  disabled?: boolean;
}

export function QuestionCard({
  question,
  index,
  totalQuestions,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  earlierQuestions,
  allQuestions,
  disabled = false,
}: QuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === question.type) return;

    let newOptions = question.options;
    // If switching to choice/checkbox, ensure options exist
    if (newType === 'single_choice' || newType === 'checkbox') {
      if (!newOptions || newOptions.length < 2) {
        newOptions = ['Option 1', 'Option 2'];
      }
    } else {
      // Switching to text or rating: clear options
      newOptions = undefined;
    }

    onUpdate({
      ...question,
      type: newType,
      options: newOptions,
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white shadow-xs transition-shadow ${
        isDragging ? 'shadow-lg border-brand-400 ring-2 ring-brand-400' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Question Card Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl gap-2">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-slate-400 hidden sm:inline-block">
            ID: <code className="text-slate-600 font-mono text-2xs">{question.id}</code>
          </span>
        </div>

        {/* Action buttons (Move Up, Move Down, Delete) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || index === 0}
            onClick={() => onMoveUp(index)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Move question up"
            aria-label="Move question up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={disabled || index === totalQuestions - 1}
            onClick={() => onMoveDown(index)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Move question down"
            aria-label="Move question down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            type="button"
            disabled={disabled || totalQuestions <= 1}
            onClick={() => onDelete(question.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent"
            title={totalQuestions <= 1 ? 'Survey must have at least one question' : 'Delete question'}
            aria-label="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Card Body */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Question Title / Prompt <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={question.label}
              disabled={disabled}
              onChange={(e) => onUpdate({ ...question, label: e.target.value })}
              placeholder="e.g. What is your overall feedback?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Response Type</label>
            <Select
              value={question.type}
              disabled={disabled}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              className="py-2 text-sm"
            >
              <option value="text">Text (Open-ended)</option>
              <option value="single_choice">Single Choice (Radio)</option>
              <option value="checkbox">Multiple Choice (Checkbox)</option>
              <option value="rating">Rating (1 to 5 Stars)</option>
            </Select>
          </div>
        </div>

        {/* Required switch */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={question.required}
              disabled={disabled}
              onChange={(e) => onUpdate({ ...question, required: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">Required question</span>
          </label>
        </div>

        {/* Options Editor (for single_choice & checkbox) */}
        {(question.type === 'single_choice' || question.type === 'checkbox') && (
          <div className="pt-2 border-t border-slate-100">
            <QuestionOptionsEditor
              options={question.options || []}
              onChange={(newOptions) => onUpdate({ ...question, options: newOptions })}
              disabled={disabled}
            />
          </div>
        )}

        {/* Conditional Logic Editor */}
        <ConditionEditor
          condition={question.condition}
          onChange={(newCond) => onUpdate({ ...question, condition: newCond })}
          earlierQuestions={earlierQuestions}
          allQuestions={allQuestions}
          currentQuestionId={question.id}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
