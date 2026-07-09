// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_24%),linear-gradient(180deg,_#f8fbfd_0%,_#eef4fb_100%)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      <div className="text-center relative z-10 animate-slide-up page-shell px-8 py-10 max-w-xl w-full">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-teal-50 border border-teal-200 mb-6">
          <Zap className="w-10 h-10 text-teal-700" />
        </div>
        <h1 className="font-display text-8xl font-black text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          This page doesn't exist or you don't have access to it.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
