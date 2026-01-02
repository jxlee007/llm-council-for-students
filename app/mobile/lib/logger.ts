let isSentryEnabled = false;

export function initLogger(sentryDsn?: string) {
  if (sentryDsn) {
    // Sentry.init({ dsn: sentryDsn });
    isSentryEnabled = true;
  }
}

export function logError(error: unknown, context?: Record<string, any>) {
  console.error("[LLM Council]", error, context);

  if (isSentryEnabled) {
    // Sentry.captureException(error, { contexts });
  }
}
