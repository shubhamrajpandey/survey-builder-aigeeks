import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSurveyResponsesApi } from '../../api/surveys';
import { Question } from '@survey/shared';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

interface ResponsesTableProps {
  rootId: string;
  questions: Question[];
}

export function ResponsesTable({ rootId, questions }: ResponsesTableProps) {
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['survey-responses', rootId, page],
    queryFn: () => getSurveyResponsesApi(rootId, page, limit),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center text-sm text-rose-600 bg-white rounded-xl border border-rose-200">
        Failed to load survey responses.
      </div>
    );
  }

  const { responses, pagination } = data;

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 text-center">
        <Inbox className="w-10 h-10 text-slate-300 mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">No responses recorded yet</h4>
        <p className="text-xs text-slate-400 mt-1">Once respondents submit answers, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase tracking-wider text-slate-500 font-semibold">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 w-44">Submitted At</th>
              <th className="py-3 px-4 w-20 text-center">Ver</th>
              {questions.map((q) => (
                <th key={q.id} className="py-3 px-4 min-w-[160px] max-w-xs truncate" title={q.label}>
                  {q.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {responses.map((res, rowIdx) => {
              const rowNum = (page - 1) * limit + rowIdx + 1;
              const dateStr = new Date(res.submittedAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={res._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center font-medium text-slate-400">{rowNum}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-2xs">{dateStr}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-600">v{res.version}</td>
                  {questions.map((q) => {
                    const ans = res.answers?.[q.id];
                    let displayVal = '—';
                    if (ans !== undefined && ans !== null && ans !== '') {
                      if (Array.isArray(ans)) {
                        displayVal = ans.join(', ');
                      } else {
                        displayVal = String(ans);
                      }
                    }

                    return (
                      <td key={q.id} className="py-3 px-4 max-w-xs truncate" title={displayVal}>
                        <span className={displayVal === '—' ? 'text-slate-300' : 'text-slate-800'}>
                          {displayVal}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <span>
          Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
          <span className="font-semibold">{Math.min(page * limit, pagination.total)}</span> of{' '}
          <span className="font-semibold">{pagination.total}</span> responses
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Prev
          </Button>
          <span className="text-xs font-semibold px-2">
            Page {page} of {pagination.totalPages || 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
