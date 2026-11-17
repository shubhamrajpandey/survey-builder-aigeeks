import React from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '../components/common/PageTitle';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <PageTitle title="404 - Page Not Found" />

      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">404</h1>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
