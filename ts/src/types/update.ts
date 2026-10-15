export interface VersionCheckResult {
  success: boolean;
  latest?: string;
  current?: string;
  updateAvailable?: boolean;
  error?: string;
}
