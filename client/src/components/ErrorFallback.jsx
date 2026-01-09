import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-editorial-bg flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-500" size={32} />
        </div>

        <h1 className="text-2xl font-serif text-editorial-text mb-2">
          Something went wrong
        </h1>

        <p className="text-gray-500 mb-6">
          We're sorry, but something unexpected happened. Please try refreshing the page or going back to the home screen.
        </p>

        {error && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-mono text-gray-600 break-all">
              {error.message || 'Unknown error'}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-editorial-text rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <Home size={18} />
            Go Home
          </button>
          <button
            onClick={onReset || handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-pastel-blue text-editorial-text rounded-xl font-medium hover:bg-pastel-blue/80 transition-colors"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
