import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSurveyAnalyticsApi, getSurveyApi } from '../api/surveys';
import { Header } from '../components/common/Header';
import { PageTitle } from '../components/common/PageTitle';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { QuestionChart } from '../components/analytics/QuestionChart';
import { ResponsesTable } from '../components/analytics/ResponsesTable';
import {
  ArrowLeft,
  Copy,
  Check,
  BarChart2,
  Table,
  Inbox,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function SurveyAnalyticsPage() {
  const { rootId } = useParams<{ rootId: string }>();
  const [selectedVersion, setSelectedVersion] = useState<string>(''); // empty = latest
  const [activeTab, setActiveTab] = useState<'charts' | 'responses'>('charts');
  const [copied, setCopied] = useState(false);

  // Fetch Survey details for base metadata
  const surveyQuery = useQuery({
    queryKey: ['survey-meta', rootId],
    queryFn: () => getSurveyApi(rootId!),
    enabled: !!rootId,
  });

  // Fetch Analytics data
  const analyticsQuery = useQuery({
    queryKey: ['survey-analytics', rootId, selectedVersion],
    queryFn: () => getSurveyAnalyticsApi(rootId!, selectedVersion || undefined),
    enabled: !!rootId,
  });

  const handleCopyLink = () => {
    if (!rootId) return;
    const url = `${window.location.origin}/s/${rootId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public survey link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const survey = surveyQuery.data?.survey;
  const analytics = analyticsQuery.data;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PageTitle title={survey ? `Analytics: ${survey.title}` : 'Survey Analytics'} />
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Surveys
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Link Copied' : 'Copy Public Survey Link'}
          </Button>
        </div>

        {/* Survey Overview Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Analytics & Reports
                </span>
                {analytics && (
                  <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Version: {analytics.version}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {survey?.title || 'Survey Analytics'}
              </h1>
              {survey?.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                  {survey.description}
                </p>
              )}
            </div>

            {/* Version Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="version-filter" className="text-xs font-semibold text-slate-600">
                Filter Version:
              </label>
              <Select
                id="version-filter"
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="text-xs py-1.5 w-36"
              >
                <option value="">Latest Version</option>
                <option value="all">All Versions Combined</option>
                {survey &&
                  Array.from({ length: survey.version || 1 }, (_, i) => i + 1).map((v) => (
                    <option key={v} value={String(v)}>
                      Version {v}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xs text-slate-400 uppercase font-semibold">Total Responses</p>
                <p className="text-lg font-bold text-slate-900">
                  {analytics?.totalResponses ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xs text-slate-400 uppercase font-semibold">Questions</p>
                <p className="text-lg font-bold text-slate-900">
                  {survey?.questions.length ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xs text-slate-400 uppercase font-semibold">Status</p>
                <p className="text-lg font-bold text-slate-900 capitalize">
                  {survey?.status ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors select-none ${
              activeTab === 'charts'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Question Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('responses')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors select-none ${
              activeTab === 'responses'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            Raw Submissions
          </button>
        </div>

        {/* Main Content */}
        {analyticsQuery.isLoading ? (
          <div className="flex items-center justify-center p-16 bg-white rounded-xl border border-slate-200">
            <Spinner size="lg" />
          </div>
        ) : analyticsQuery.isError ? (
          <ErrorState
            title="Unable to load analytics"
            message="We could not aggregate response statistics for this survey."
            onRetry={() => analyticsQuery.refetch()}
          />
        ) : analytics?.totalResponses === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No responses recorded yet"
            description="Share your public survey link with respondents to begin viewing real-time charts and metrics."
            action={
              <Button variant="primary" onClick={handleCopyLink} leftIcon={<Copy className="w-4 h-4" />}>
                Copy Public Link
              </Button>
            }
          />
        ) : activeTab === 'charts' ? (
          <div className="space-y-6">
            {analytics?.questions.map((q, idx) => (
              <QuestionChart key={q.questionId} question={q} index={idx} />
            ))}
          </div>
        ) : (
          <ResponsesTable rootId={rootId!} questions={survey?.questions || []} />
        )}
      </main>
    </div>
  );
}
