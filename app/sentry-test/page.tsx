'use client';

import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-bold">Sentry Error Test</h1>
      <p className="text-neutral-600 mb-4">Click the button below to trigger a test error</p>

      <button
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
        onClick={() => {
          throw new Error('This is a test error from Sentry!');
        }}
      >
        Break the world
      </button>

      <button
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        onClick={() => {
          Sentry.captureMessage('Test message from Sentry button');
          alert('Message sent to Sentry!');
        }}
      >
        Send Test Message
      </button>
    </div>
  );
}
