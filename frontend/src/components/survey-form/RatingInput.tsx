import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  id: string;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RatingInput({ id, value, onChange, disabled = false }: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-2 sm:gap-3 py-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = hovered !== null ? star <= hovered : value !== undefined && star <= value;

        return (
          <button
            key={star}
            type="button"
            id={`${id}-star-${star}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className={`group relative p-2 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
              isFilled
                ? 'text-amber-400 scale-105 bg-amber-50/60'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-50'
            }`}
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <Star
              className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform ${
                isFilled ? 'fill-current' : 'fill-transparent'
              }`}
            />
            <span className="sr-only">{star}</span>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-2xs font-semibold text-slate-400 group-hover:text-slate-600 select-none">
              {star}
            </span>
          </button>
        );
      })}
      {value !== undefined && (
        <span className="ml-3 text-sm font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
          {value} / 5
        </span>
      )}
    </div>
  );
}
