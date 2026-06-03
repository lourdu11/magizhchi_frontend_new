import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI_CRASH_REPORT:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-5 md:p-10 shadow-xl border border-[#DADCE0] text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-2xl font-black text-[#202124] tracking-tighter uppercase mb-4">Something went wrong</h1>
            <p className="text-[#5F6368] font-medium mb-8">
              The application encountered an unexpected UI error. Don't worry, your data is safe.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-[#1A73E8] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                <RefreshCcw size={14} /> Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-[#F1F3F4] text-[#5F6368] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Home size={14} /> Back to Home
              </button>
            </div>
            {import.meta.env.DEV && (
              <div className="mt-8 p-4 bg-gray-50 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-red-500">{this.state.error?.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
