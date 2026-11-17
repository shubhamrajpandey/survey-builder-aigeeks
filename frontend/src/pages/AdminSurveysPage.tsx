import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSurveysApi, updateSurveyStatusApi, deleteSurveyApi, SurveyWithStats } from '../api/surveys';
import { Header } from '../components/common/Header';
import { PageTitle } from '../components/common/PageTitle';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Plus,
  ExternalLink,
  BarChart2,
  Edit3,
  Trash2,
  Copy,
  Check,
  ClipboardList,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminSurveysPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SurveyWithStats | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-surveys'],
    queryFn: listSurveysApi,
  });

  const statusMutation = useMutation({
    mutationFn: ({ rootId, status }: { rootId: string; status: 'published' | 'closed' }) =>
      updateSurveyStatusApi(rootId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] });
      toast.success(`Survey ${vars.status === 'published' ? 'published' : 'closed'} successfully`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update survey status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (rootId: string) => deleteSurveyApi(rootId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] });
      toast.success('Survey deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete survey');
    },
  });

  const handleCopyLink = (rootId: string) => {
    const url = `${window.location.origin}/s/${rootId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(rootId);
    toast.success('Public survey link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PageTitle title="Dashboard" />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Banner / Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Surveys</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create, configure, publish, and monitor live responses and analytics.
            </p>
          </div>

          <Link to="/admin/surveys/new">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              New Survey
            </Button>
          </Link>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load surveys"
            message="We encountered an issue fetching your surveys. Please try again."
            onRetry={() => refetch()}
          />
        ) : !data?.surveys || data.surveys.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No surveys created yet"
            description="Start collecting user feedback and survey responses by creating your first dynamic survey."
            action={
              <Link to="/admin/surveys/new">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Survey
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                    <th className="py-3 px-4 w-24 text-center">Version</th>
                    <th className="py-3 px-4 w-32 text-center">Responses</th>
                    <th className="py-3 px-4 w-36">Created</th>
                    <th className="py-3 px-4 w-60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.surveys.map(({ survey, responseCount }) => {
                    const rootId = survey.rootId || survey._id || '';
                    const dateStr = survey.createdAt
                      ? new Date(survey.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={rootId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <Link
                            to={`/admin/surveys/${rootId}/edit`}
                            className="font-semibold text-sm text-slate-900 hover:text-brand-600 transition-colors block"
                          >
                            {survey.title}
                          </Link>
                          {survey.description ? (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
                              {survey.description}
                            </p>
                          ) : (
                            <span className="text-2xs text-slate-400 italic">No description</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <Badge
                            variant={
                              survey.status === 'published'
                                ? 'success'
                                : survey.status === 'closed'
                                ? 'neutral'
                                : 'warning'
                            }
                          >
                            {survey.status || 'draft'}
                          </Badge>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            v{survey.version || 1}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <Link
                            to={`/admin/surveys/${rootId}/analytics`}
                            className="inline-flex items-center gap-1 font-semibold text-xs text-brand-600 hover:text-brand-800"
                          >
                            <span>{responseCount}</span>
                            <span className="text-slate-400 text-2xs font-normal">
                              {responseCount === 1 ? 'entry' : 'entries'}
                            </span>
                          </Link>
                        </td>

                        <td className="py-4 px-4 text-slate-500 font-mono text-2xs">{dateStr}</td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Public Link */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyLink(rootId)}
                              title="Copy public link"
                              className="text-slate-500 hover:text-slate-900"
                            >
                              {copiedId === rootId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>

                            {/* Analytics Link */}
                            <Link to={`/admin/surveys/${rootId}/analytics`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="View analytics & responses"
                                className="text-slate-500 hover:text-brand-600"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            {/* Edit Survey */}
                            <Link to={`/admin/surveys/${rootId}/edit`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Edit survey builder"
                                className="text-slate-500 hover:text-slate-900"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            {/* Publish / Close Toggle */}
                            {survey.status === 'published' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Close survey"
                                onClick={() =>
                                  statusMutation.mutate({ rootId, status: 'closed' })
                                }
                                disabled={statusMutation.isPending}
                                className="text-amber-600 hover:text-amber-700"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Publish survey"
                                onClick={() =>
                                  statusMutation.mutate({ rootId, status: 'published' })
                                }
                                disabled={statusMutation.isPending}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Delete Survey */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget({ survey, responseCount })}
                              title="Delete survey"
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.survey.rootId) {
            deleteMutation.mutate(deleteTarget.survey.rootId);
          }
        }}
        title="Delete Survey"
        message={`Are you sure you want to delete "${deleteTarget?.survey.title}"? This will permanently remove all versions and all ${deleteTarget?.responseCount || 0} associated responses. This action cannot be undone.`}
        confirmText="Delete Survey"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
