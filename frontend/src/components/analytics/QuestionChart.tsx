import React from 'react';
import { QuestionAnalytics } from '@survey/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Star, MessageSquareQuote } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface QuestionChartProps {
  question: QuestionAnalytics;
  index: number;
}

export function QuestionChart({ question, index }: QuestionChartProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50/50 flex flex-row items-start justify-between gap-4 py-4">
        <div className="flex items-start gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-bold shrink-0 mt-0.5 border border-brand-200">
            {index + 1}
          </span>
          <div>
            <CardTitle className="text-sm sm:text-base">{question.label}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Type:{' '}
              <span className="font-medium text-slate-700 capitalize">
                {question.type.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {question.answered} {question.answered === 1 ? 'response' : 'responses'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {question.answered === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">
            No responses recorded for this question yet.
          </p>
        ) : question.type === 'single_choice' || question.type === 'checkbox' ? (
          <div className="space-y-4">
            {/* Visual Recharts Bar Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={question.counts}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    dataKey="option"
                    type="category"
                    stroke="#475569"
                    fontSize={11}
                    width={80}
                    tickFormatter={(val) => (val.length > 12 ? `${val.slice(0, 10)}...` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [`${val} votes`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {question.counts.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={i % 2 === 0 ? '#6366f1' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown table */}
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-3">
              {question.counts.map((item) => {
                const pct =
                  question.answered > 0
                    ? Math.round((item.count / question.answered) * 100)
                    : 0;

                return (
                  <div key={item.option} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.option}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{item.count}</span>
                      <span className="w-12 text-right text-slate-500 font-mono">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : question.type === 'rating' ? (
          <div>
            {/* Rating Average Hero */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 mb-4 bg-amber-50/40 rounded-xl border border-amber-100 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 text-amber-500 fill-amber-400" />
                <span className="text-3xl font-extrabold text-slate-900">
                  {question.average !== null ? question.average.toFixed(2) : 'N/A'}
                </span>
                <span className="text-sm text-slate-500 self-end mb-1">/ 5.0</span>
              </div>
              <div className="text-xs text-slate-600 sm:border-l sm:border-amber-200 sm:pl-6">
                Based on <span className="font-semibold">{question.answered}</span> respondent
                ratings
              </div>
            </div>

            {/* 1-5 Star Distribution Histogram */}
            <div className="space-y-2 pt-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count =
                  question.distribution[String(stars) as '1' | '2' | '3' | '4' | '5'] || 0;
                const pct =
                  question.answered > 0 ? Math.round((count / question.answered) * 100) : 0;

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-semibold text-slate-700 flex items-center gap-1">
                      {stars} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-medium text-slate-600">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Text Answers List */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>{question.answers.length} recent text responses</span>
              {question.hasMore && (
                <span className="text-brand-600 font-medium">Showing latest 200 answers</span>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {question.answers.map((answer, ansIdx) => (
                <div
                  key={ansIdx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5"
                >
                  <MessageSquareQuote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="break-words flex-1">{answer}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
