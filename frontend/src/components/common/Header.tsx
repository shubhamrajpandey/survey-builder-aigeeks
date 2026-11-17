import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ClipboardList, LogOut, PlusCircle } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs group-hover:bg-brand-700 transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                AiGeeks Survey
              </span>
              <span className="hidden sm:inline-block ml-2 text-2xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Admin
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/surveys/new">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Survey
            </Button>
          </Link>

          {user && (
            <div className="hidden md:flex flex-col text-right px-2">
              <span className="text-xs font-medium text-slate-700 truncate max-w-[160px]">
                {user.email}
              </span>
              <span className="text-2xs text-slate-400">Administrator</span>
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="text-slate-500 hover:text-slate-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
