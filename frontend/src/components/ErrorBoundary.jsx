import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-slate-400 max-w-md mb-8">
            An unexpected error occurred in this section of the app. 
            We've logged the issue, but you can try reloading the page.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={this.handleReset}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Reload Page
            </button>
            <button 
              onClick={() => window.history.back()}
              className="btn-ghost"
            >
              Go Back
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 p-4 bg-slate-900/50 rounded-xl border border-white/10 max-w-2xl w-full text-left overflow-auto">
              <p className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                {this.state.error.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
