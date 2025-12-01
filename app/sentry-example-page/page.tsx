"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

export default function SentryExamplePage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 className="text-2xl font-bold">Sentry Example Page</h1>
      <p className="text-neutral-600 max-w-md text-center">
        Click a button below to trigger a test error and verify Sentry is working.
      </p>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          onClick={() => {
            // This will trigger a client-side error that Sentry captures
            const error = new Error("Sentry Example Frontend Error");
            Sentry.captureException(error);
            throw error;
          }}
        >
          Throw Frontend Error
        </button>

        <button
          type="button"
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
          onClick={async () => {
            // Trigger a server-side error via API route
            await fetch("/api/sentry-example-api");
          }}
        >
          Trigger API Error
        </button>
      </div>
    </div>
  );
}
