interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
}

const queue: ErrorReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0);
  // In production, send to your monitoring endpoint
  // For now, log to console in dev and send to /api/errors in prod
  if (import.meta.env.DEV) {
    console.groupCollapsed(`[ErrorReporter] ${batch.length} error(s)`);
    batch.forEach((e) => console.error(e.message, e.stack));
    console.groupEnd();
  } else {
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_API_URL || ""}/api/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ errors: batch }),
    }).catch(() => {});
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flush(); }, 5000);
}

export function reportError(error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  queue.push({
    message: err.message,
    stack: err.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
  scheduleFlush();
}

// Global handlers
export function installGlobalErrorHandlers() {
  window.addEventListener("error", (e) => reportError(e.error));
  window.addEventListener("unhandledrejection", (e) => reportError(e.reason));
}
