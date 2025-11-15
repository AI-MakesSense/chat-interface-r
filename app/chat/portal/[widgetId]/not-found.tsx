'use client';

/**
 * Portal Not Found Page
 *
 * Purpose: Custom 404 page for invalid widget IDs or inactive widgets
 * Displayed when widget doesn't exist, is inactive, or license is expired
 */

export default function PortalNotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>Widget Not Found</h1>
        <p>
          The chat widget you're looking for doesn't exist or is no longer available.
        </p>
        <p className="error-code">Error: WIDGET_NOT_FOUND</p>
      </div>

      <style jsx>{`
        .not-found-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .not-found-content {
          background: white;
          padding: 48px;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          text-align: center;
        }

        h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 16px 0;
        }

        p {
          font-size: 16px;
          color: #4a5568;
          margin: 0 0 12px 0;
          line-height: 1.6;
        }

        .error-code {
          font-size: 14px;
          color: #a0aec0;
          font-family: monospace;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
}
