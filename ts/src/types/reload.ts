export interface ReloadSummary { loaded: number; failed: number; }
export interface ReloadAllResult {
  commands: ReloadSummary;
  functions: ReloadSummary;
  interactions: ReloadSummary;
}
