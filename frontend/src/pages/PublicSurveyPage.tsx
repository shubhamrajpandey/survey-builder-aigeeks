import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicSurveyApi, submitPublicResponseApi } from '../api/public';
import { SurveyForm } from '../components/survey-form/SurveyForm';
import { Spinner } from '../components/ui/Spinner';
import { PageTitle } from '../components/common/PageTitle';
import { Button } from '../components/ui/Button';
import { ClipboardList, Lock, Clock, FileQuestion, AlertCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export function PublicSurveyPage() {
  const { rootId } = useParams<{ rootId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-survey', rootId],
    queryFn: () => getPublicSurveyApi(rootId!),
    retry: false,
    enabled: !!rootId,
  });

  const handleSubmit = async (answers: Record<string, any>, honeypot?: string) => {
    if (!rootId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitPublicResponseApi(rootId, { answers, website: honeypot });
      navigate(`/s/${rootId}/thanks`);
    } catch (err: any) {
      if (err.statusCode === 429) {
        setSubmitError(
          'Submission limit reached: You have submitted too many requests recently. Please wait a minute before submitting again.'
        );
      } else if (err.code === 'SPAM_DETECTED') {
        setSubmitError('A recent duplicate response was detected. Please wait before submitting again.');
      } else {
        setSubmitError(err.message || 'Failed to submit survey. Please try again.');
      }
      toast.error('Submission failed. Please check the errors above.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Handle specific backend error status codes
  if (error || !data?.survey) {
    const apiErr = error as any;
    const errorCode = apiErr?.code;

    if (errorCode === 'SURVEY_DRAFT') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <PageTitle title="Survey in Draft Mode" />
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Survey Not Yet Active</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              This survey is currently in draft mode and is not accepting public responses yet. Please check back later.
            </p>
          </div>
        </div>
      );
    }

    if (errorCode === 'SURVEY_CLOSED') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <PageTitle title="Survey Closed" />
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Survey Closed</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              This survey has ended and is no longer accepting submissions. Thank you for your interest!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <PageTitle title="Survey Not Found" />
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Survey Not Found</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            The survey link you followed may be incorrect, expired, or has been removed.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const survey = data.survey;

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6">
      <PageTitle title={survey.title} />

      <div className="max-w-2xl mx-auto">
        {/* Survey Banner / Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
              <ClipboardList className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-brand-700 tracking-wider uppercase">
              AiGeeks Survey
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {survey.title}
          </h1>

          {survey.description && (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {survey.description}
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400">
            <span>Powered by AiGeeks Dynamic Engine</span>
            <span>All responses are anonymous</span>
          </div>
        </div>

        {/* Global Submission Error Banner */}
        {submitError && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Submission error: </span>
              {submitError}
            </div>
          </div>
        )}

        {/* Dynamic Survey Form with live conditional logic */}
        <SurveyForm
          survey={survey}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
