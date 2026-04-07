'use client';

/**
 * Loading State for Fullpage Chat
 *
 * Displays while the widget configuration is being loaded
 */

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <style jsx>{`
        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e0e0e0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-color-scheme: dark) {
          .loading-container {
            background: #1a1a1a;
          }

          .loading-spinner {
            border-color: #333;
            border-top-color: #818cf8;
          }
        }
      `}</style>
    </div>
  );
}
