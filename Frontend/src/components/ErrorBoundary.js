import React from "react";
import { Link } from "react-router-dom";
import { BiError } from "react-icons/bi";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100%', backgroundColor: '#0D1019', color: '#E1E1E3',
          fontFamily: 'var(--raleway)', textAlign: 'center', padding: '2rem'
        }}>
          <BiError size={64} color="#f5a524" style={{ marginBottom: '1.5rem' }} />
          <h1 style={{ fontFamily: 'var(--syne)', fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>
            Something went wrong.
          </h1>
          <p style={{ color: '#BBBEC6', marginBottom: '2rem', maxWidth: '600px', lineHeight: '1.6' }}>
            A critical error occurred while rendering this page. We've caught the error to prevent the entire protocol interface from crashing.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              padding: '0.75rem 1.5rem', background: 'var(--linearBg)',
              borderRadius: '8px', border: 'none', color: '#fff',
              fontFamily: 'var(--raleway)', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
