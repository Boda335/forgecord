export interface ForgecordErrorMeta {
  code?: string;
  context?: Record<string, unknown>;
}

export type ErrorContext = Record<string, unknown>;
