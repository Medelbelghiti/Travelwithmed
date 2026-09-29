const CONNECTION_ERROR_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1010",
  "P1011",
  "P1017",
  "P2024",
  "P2028",
  "P2034",
]);

const CONNECTION_ERROR_PATTERNS = [
  "can't reach database server",
  "cannot connect to the database",
  "connection refused",
  "econnrefused",
  "econnreset",
  "enotfound",
  "eai_again",
  "password authentication failed",
  "server has closed the connection",
  "timed out fetching a new connection",
  "the database system is",
  "too many connections",
  "timeout exceeded",
  "prisma client initialization error",
  "timed out",
];

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) return true;

  const message = error.message.toLowerCase();
  return CONNECTION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function reportDatabaseUnavailable(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    "[db] Database unreachable, request will fail loudly instead of returning 404:",
    message,
  );
}

export function rethrowIfDatabaseUnavailable(error: unknown): void {
  if (!isDatabaseUnavailableError(error)) return;
  reportDatabaseUnavailable(error);
  throw error;
}
