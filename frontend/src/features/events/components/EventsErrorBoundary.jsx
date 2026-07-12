import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';

export default class EventsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Events Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 mb-6">
              We encountered an error while loading this page. Please try refreshing or go back.
            </p>
            {import.meta.env.DEV && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-rose-700 break-words">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Refresh Page
              </button>
              <a
                href="/events"
                className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" /> Back to Events
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
