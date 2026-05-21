import React from 'react';
import { RefreshCcw, Home, WifiOff } from 'lucide-react';

/**
 * RouteErrorBoundary — wraps individual page content inside layouts.
 * When a page crashes, only the page content is replaced with an error card.
 * The Header, Footer, and Navigation remain functional so users can navigate away.
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[RouteErrorBoundary] Page crash:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('dynamically imported module') ||
                           this.state.error?.message?.includes('Loading chunk') ||
                           this.state.error?.message?.includes('Failed to fetch');

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-amber-50 text-premium-gold rounded-2xl flex items-center justify-center mx-auto mb-6">
              {isChunkError ? <WifiOff size={32} /> : <RefreshCcw size={32} />}
            </div>

            <h2 className="text-xl font-black text-charcoal tracking-tighter mb-2">
              {isChunkError ? 'Connection Issue' : 'Page Error'}
            </h2>
            <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
              {isChunkError
                ? 'Looks like your connection was interrupted. Please check your network and try again.'
                : 'This page encountered an unexpected error. Your data is safe.'}
            </p>

            <div className="space-y-3">
              <button
                onClick={isChunkError ? () => window.location.reload() : this.handleRetry}
                className="w-full bg-charcoal text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-charcoal/90 transition-all active:scale-95"
              >
                <RefreshCcw size={14} /> {isChunkError ? 'Reload Page' : 'Try Again'}
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="w-full bg-gray-50 text-gray-500 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
              >
                <Home size={14} /> Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
