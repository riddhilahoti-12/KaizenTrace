export async function reportToKaizenTrace(event: {
  eventType: 'APP_ERROR' | 'HTTP_FAILURE' | 'TEST_FAILURE' | 'DB_OPERATION' | 'JOB_FAILURE' | 'GIT_CHANGE' | 'FIX_VERIFICATION';
  component: string;
  route?: string;
  requestId?: string;
  operation?: string;
  errorMessage?: string;
  stackTrace?: string;
  sourceFile?: string;
  sourceLine?: number;
  outcome?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const kaizenUrl = process.env.KAIZENTRACE_URL || 'http://localhost:5050';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    fetch(`${kaizenUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    })
      .catch(() => {}) // Non-blocking: never crash TeamFlow
      .finally(() => clearTimeout(timeout));
  } catch {
    // Non-blocking
  }
}
