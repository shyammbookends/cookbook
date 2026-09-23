/**
 * Typed application errors. Services throw these; the API/action layer maps
 * them to safe responses. Anything else (a raw DB error, a thrown string,
 * an unexpected exception) is treated as unknown and never shown to a user —
 * see `toSafeError` below.
 */

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "UPLOAD_FAILED"
  | "IMPORT_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message: string,
    opts: { status?: number; fieldErrors?: Record<string, string[]> } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = opts.status ?? defaultStatus(code);
    this.fieldErrors = opts.fieldErrors;
  }
}

function defaultStatus(code: ErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "RATE_LIMITED":
      return 429;
    case "UPLOAD_FAILED":
    case "IMPORT_FAILED":
      return 422;
    default:
      return 500;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super("VALIDATION_FAILED", message, { fieldErrors });
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super("NOT_FOUND", `${entity} not found.`);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super("FORBIDDEN", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Please sign in to continue.") {
    super("UNAUTHORIZED", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message);
  }
}

/**
 * Turn any thrown value into a safe, serializable shape. Unknown errors get
 * a random reference id (logged server-side with the real stack) instead of
 * leaking internals to the client.
 */
export function toSafeError(err: unknown): {
  status: number;
  body: { error: { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]>; requestId: string } };
} {
  const requestId = Math.random().toString(36).slice(2, 10);

  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, fieldErrors: err.fieldErrors, requestId } },
    };
  }

  console.error(`[${requestId}] Unhandled error:`, err);

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL",
        message: `Something went wrong (ref: ${requestId}).`,
        requestId,
      },
    },
  };
}
