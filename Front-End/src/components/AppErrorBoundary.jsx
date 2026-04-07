import React from 'react';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-900/60 bg-slate-900 p-6 text-slate-200 shadow-xl">
          <h1 className="text-xl font-semibold text-red-300">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-300">
            The app hit an unexpected error. Reload to recover.
          </p>
          <p className="mt-3 rounded-md bg-slate-800 p-3 text-xs text-slate-400">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
