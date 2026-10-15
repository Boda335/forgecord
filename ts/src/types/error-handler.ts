export interface ErrorHandlerOptions {
  fileLoggingEnabled?: boolean;
  webhookURL?: string;
  webhookIntervalMs?: number;
}
export interface SafeExecuteContext {
  kind?: string;
  name?: string;
  [key: string]: unknown;
}
