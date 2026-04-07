'use client';

/**
 * 404 Not Found for Fullpage Chat
 *
 * Displays when widget is not found or inactive
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>Widget Not Found</h1>
        <p>The chat widget you're looking for doesn't exist or has been deactivated.</p>
        <Link href="/" className="home-link">
          Go to Homepage
        </Link>
      </div>

      <style jsx>{`
        .not-found-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .not-found-content {
          text-align: center;
          padding: 2rem;
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .home-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #6366f1;
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: background 0.2s;
        }

        .home-link:hover {
          background: #4f46e5;
        }

        @media (prefers-color-scheme: dark) {
          .not-found-container {
            background: #1a1a1a;
          }

          h1 {
            color: #e5e7eb;
          }

          p {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
}
