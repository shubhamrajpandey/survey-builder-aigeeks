import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { PageTitle } from '../components/common/PageTitle';
import { ClipboardList, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await loginApi({ email, password });
      login(res.token, res.admin);
      toast.success('Signed in successfully');
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <PageTitle title="Admin Sign In" />

      <div className="max-w-md w-full">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-brand-500/20 mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AiGeeks Survey Builder</h1>
          <p className="text-xs text-slate-500 mt-1">Administrator Sign In</p>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your administrator credentials to access the console</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Admin Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aigeeks.io"
                disabled={isLoading}
              />

              <Input
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full mt-2"
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Sign In to Console
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-2xs text-slate-400">
                Default Seed: <code className="text-slate-600 font-mono">admin@aigeeks.io</code> /{' '}
                <code className="text-slate-600 font-mono">AdminPassword123!</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
