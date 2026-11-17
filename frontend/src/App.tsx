import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { LoginPage } from './pages/LoginPage';
import { AdminSurveysPage } from './pages/AdminSurveysPage';
import { SurveyBuilderPage } from './pages/SurveyBuilderPage';
import { SurveyAnalyticsPage } from './pages/SurveyAnalyticsPage';
import { PublicSurveyPage } from './pages/PublicSurveyPage';
import { ThankYouPage } from './pages/ThankYouPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? '/admin' : '/login'} replace />;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminSurveysPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/surveys/new"
                element={
                  <ProtectedRoute>
                    <SurveyBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/surveys/:rootId/edit"
                element={
                  <ProtectedRoute>
                    <SurveyBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/surveys/:rootId/analytics"
                element={
                  <ProtectedRoute>
                    <SurveyAnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* Public Survey Form Routes */}
              <Route path="/s/:rootId" element={<PublicSurveyPage />} />
              <Route path="/s/:rootId/thanks" element={<ThankYouPage />} />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
