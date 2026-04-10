/**
 * /client/src/components/ErrorBoundary.jsx
 * Class component — the only way to catch render-phase errors in React.
 * Wrap around any subtree that may throw during rendering.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card glass-panel">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-boundary-msg">
              {import.meta.env.DEV
                ? this.state.error?.message || 'An unexpected error occurred'
                : 'An unexpected error occurred. Please try again.'}
            </p>
            <button className="btn-primary" onClick={this.handleRetry} style={{ width: 'auto' }}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
