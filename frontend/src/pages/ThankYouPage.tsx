import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageTitle } from '../components/common/PageTitle';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function ThankYouPage() {
  const { rootId } = useParams<{ rootId: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <PageTitle title="Thank You!" />

      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Thank you for your feedback!
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Your response has been safely submitted and recorded. We appreciate you taking the time to share your perspective with us.
        </p>

        {rootId && (
          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <Link to={`/s/${rootId}`}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Submit another response
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
