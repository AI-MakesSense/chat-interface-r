'use client';

/**
 * Portal Loading Page
 *
 * Purpose: Loading state while widget config is being fetched from database
 * Displays during server-side data fetching
 */

export default function PortalLoading() {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner" />
        <p>Loading chat...</p>
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-content {
          text-align: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        p {
          color: white;
          font-size: 16px;
          font-weight: 500;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
