import React from 'react';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionOptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
  disabled?: boolean;
}

export function QuestionOptionsEditor({
  options = [],
  onChange,
  disabled = false,
}: QuestionOptionsEditorProps) {
  const handleAddOption = () => {
    const nextIdx = options.length + 1;
    onChange([...options, `Option ${nextIdx}`]);
  };

  const handleUpdateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    onChange(next);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert('A choice question must have at least 2 options.');
      return;
    }
    const next = options.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Answer Options (minimum 2)
        </label>
        <span className="text-2xs text-slate-500 font-medium">
          {options.length} options defined
        </span>
      </div>

      <div className="space-y-2">
        {options.map((option, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs font-semibold text-slate-400 select-none">
              {idx + 1}.
            </span>
            <input
              type="text"
              value={option}
              disabled={disabled}
              onChange={(e) => handleUpdateOption(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              disabled={disabled || options.length <= 2}
              onClick={() => handleRemoveOption(idx)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              title={options.length <= 2 ? 'At least 2 options required' : 'Delete option'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={handleAddOption}
        leftIcon={<Plus className="w-3.5 h-3.5" />}
        className="text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50"
      >
        Add Another Option
      </Button>
    </div>
  );
}
