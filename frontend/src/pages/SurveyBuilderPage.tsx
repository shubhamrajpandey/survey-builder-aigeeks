import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSurveyApi,
  getSurveyApi,
  updateSurveyApi,
} from '../api/surveys';
import { Question, QuestionType, validateSurveySchema } from '@survey/shared';
import { Header } from '../components/common/Header';
import { PageTitle } from '../components/common/PageTitle';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { ConfirmDialog } from '../components/ui/Modal';
import { QuestionList } from '../components/survey-builder/QuestionList';
import { SurveyLivePreview } from '../components/survey-builder/SurveyLivePreview';
import {
  Save,
  Send,
  Eye,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Info,
  Type,
  CheckSquare,
  ListFilter,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function SurveyBuilderPage() {
  const { rootId } = useParams<{ rootId?: string }>();
  const isEditing = Boolean(rootId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch existing survey if in edit mode
  const { data, isLoading, isError } = useQuery({
    queryKey: ['survey-detail', rootId],
    queryFn: () => getSurveyApi(rootId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (data?.survey) {
      setTitle(data.survey.title);
      setDescription(data.survey.description || '');
      setQuestions(data.survey.questions || []);
      setIsDirty(false);
    } else if (!isEditing) {
      // Default template for new survey
      setTitle('Untitled Survey');
      setDescription('');
      setQuestions([
        {
          id: 'q1',
          type: 'single_choice',
          label: 'Do you use our application?',
          required: true,
          options: ['Yes', 'No'],
        },
      ]);
      setIsDirty(false);
    }
  }, [data, isEditing]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Real-time validation using validateSurveySchema from @survey/shared
  const validationResult = useMemo(() => {
    return validateSurveySchema({
      title,
      description,
      questions,
      status: 'draft',
    });
  }, [title, description, questions]);

  // Mutation for saving
  const saveMutation = useMutation({
    mutationFn: async ({ status }: { status: 'draft' | 'published' }) => {
      // Validate schema on save
      if (!validationResult.ok) {
        throw new Error(validationResult.errors?.[0] || 'Please fix schema errors before saving.');
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        questions,
        status,
      };

      if (isEditing && rootId) {
        return updateSurveyApi(rootId, payload);
      } else {
        return createSurveyApi(payload);
      }
    },
    onSuccess: (res, vars) => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] });
      toast.success(
        vars.status === 'published'
          ? 'Survey saved and published!'
          : 'Survey saved as draft!'
      );
      navigate('/admin');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save survey');
    },
  });

  // Adding a question
  const handleAddQuestion = (type: QuestionType) => {
    const nextNum = questions.length + 1;
    const newId = `q${Date.now().toString(36).slice(-4)}_${nextNum}`;

    let defaultOptions: string[] | undefined = undefined;
    if (type === 'single_choice' || type === 'checkbox') {
      defaultOptions = ['Option 1', 'Option 2'];
    }

    const newQ: Question = {
      id: newId,
      type,
      label: `Question ${nextNum}`,
      required: true,
      options: defaultOptions,
    };

    setQuestions((prev) => [...prev, newQ]);
    setIsDirty(true);
  };

  // Check dependent questions before deleting
  const dependentQuestionsCount = useMemo(() => {
    if (!deleteCandidateId) return 0;
    return questions.filter((q) => q.condition?.questionId === deleteCandidateId).length;
  }, [deleteCandidateId, questions]);

  const confirmDeleteQuestion = () => {
    if (!deleteCandidateId) return;

    // Filter out question and clear any conditions depending on it
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== deleteCandidateId)
        .map((q) => {
          if (q.condition?.questionId === deleteCandidateId) {
            return { ...q, condition: undefined };
          }
          return q;
        })
    );
    setDeleteCandidateId(null);
    setIsDirty(true);
    toast.success('Question removed');
  };

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isEditing && isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 bg-white rounded-xl border border-rose-200 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Survey Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              The survey you are attempting to edit could not be loaded.
            </p>
            <Link to="/admin">
              <Button variant="primary">Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSurveyDraft = {
    title,
    description,
    questions,
    version: data?.survey.version || 1,
    rootId: rootId || 'new',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PageTitle title={isEditing ? `Edit: ${title}` : 'New Survey Builder'} />
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Surveys
          </Link>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Live Preview
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={saveMutation.isPending}
              disabled={!validationResult.ok}
              onClick={() => saveMutation.mutate({ status: 'draft' })}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Draft
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={saveMutation.isPending}
              disabled={!validationResult.ok}
              onClick={() => saveMutation.mutate({ status: 'published' })}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Publish Survey
            </Button>
          </div>
        </div>

        {/* Versioning Notice when editing survey with existing responses */}
        {isEditing && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Survey Versioning Active:</span> If this survey has
              existing responses, saving modifications will automatically create a new version (v
              {(data?.survey.version || 1) + 1}); existing responses remain permanently matched to
              their original version schema.
            </div>
          </div>
        )}

        {/* Validation Errors Notice */}
        {!validationResult.ok && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Please resolve the following before saving:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {validationResult.errors?.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Survey Meta Settings Card */}
        <Card className="mb-6 shadow-xs">
          <CardContent className="space-y-4">
            <Input
              label="Survey Title"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. Customer Satisfaction Survey 2026"
              className="text-base font-semibold"
            />

            <Textarea
              label="Description (Optional)"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Explain the purpose of this survey to your respondents..."
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Question Cards Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Questions ({questions.length})
            </h2>
            <span className="text-2xs text-slate-400">
              Drag by the handle or use arrow buttons to reorder
            </span>
          </div>

          <QuestionList
            questions={questions}
            onChange={(newQuestions) => {
              setQuestions(newQuestions);
              setIsDirty(true);
            }}
            onDeleteQuestion={(id) => {
              const deps = questions.filter((q) => q.condition?.questionId === id).length;
              if (deps > 0) {
                setDeleteCandidateId(id);
              } else {
                setQuestions((prev) => prev.filter((q) => q.id !== id));
                setIsDirty(true);
              }
            }}
          />
        </div>

        {/* Add Question Menu Bar */}
        <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
            Add Question by Type
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddQuestion('single_choice')}
              leftIcon={<ListFilter className="w-4 h-4 text-brand-600" />}
              className="justify-start py-2.5 text-xs"
            >
              Single Choice
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddQuestion('checkbox')}
              leftIcon={<CheckSquare className="w-4 h-4 text-emerald-600" />}
              className="justify-start py-2.5 text-xs"
            >
              Multi-Select
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddQuestion('rating')}
              leftIcon={<Star className="w-4 h-4 text-amber-500" />}
              className="justify-start py-2.5 text-xs"
            >
              1-5 Star Rating
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddQuestion('text')}
              leftIcon={<Type className="w-4 h-4 text-slate-600" />}
              className="justify-start py-2.5 text-xs"
            >
              Open Text
            </Button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal for Questions with Dependents */}
      <ConfirmDialog
        isOpen={!!deleteCandidateId}
        onClose={() => setDeleteCandidateId(null)}
        onConfirm={confirmDeleteQuestion}
        title="Remove Question"
        message={`${dependentQuestionsCount} other ${
          dependentQuestionsCount === 1 ? 'question depends' : 'questions depend'
        } on this question. Removing it will automatically clear those dependent conditional rules.`}
        confirmText="Remove and Clear Conditions"
        variant="danger"
      />

      {/* Live Preview Modal */}
      <SurveyLivePreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        survey={currentSurveyDraft}
      />
    </div>
  );
}
