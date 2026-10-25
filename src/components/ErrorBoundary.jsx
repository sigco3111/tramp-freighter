/**
 * Error Boundary component for React error handling.
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 * React Migration Spec: Requirements 36.1, 36.2, 36.3, 36.4, 36.5
 */
import React from 'react';

/**
 * Error Boundary component to catch and handle React errors gracefully.
 *
 * Catches errors in child components and displays a fallback UI instead of
 * crashing the entire application. Logs error details for debugging.
 *
 * React Migration Spec: Requirements 36.1, 36.2, 36.3, 36.4, 36.5
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught.
   *
   * React Migration Spec: Requirements 36.1, 36.2
   *
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state with error information
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details when an error is caught.
   *
   * React Migration Spec: Requirements 36.3
   *
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - React error info with component stack
   */
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  /**
   * Handle reload button click.
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-boundary"
          style={{
            padding: '40px',
            fontFamily: 'sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            borderRadius: '8px',
            marginTop: '40px',
          }}
        >
          <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
            문제가 발생했습니다
          </h2>
          <p style={{ marginBottom: '20px' }}>
            애플리케이션에서 오류가 발생했습니다. 페이지를 새로고침하면 복구될 수 있습니다.
          </p>
          {this.state.error && (
            <div
              style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#ff6b6b',
                overflowX: 'auto',
              }}
            >
              <strong>오류:</strong> {this.state.error.toString()}
              {this.state.errorInfo && (
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: '#aaa' }}>
                    컴포넌트 스택
                  </summary>
                  <pre
                    style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: '#ccc',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            애플리케이션 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
