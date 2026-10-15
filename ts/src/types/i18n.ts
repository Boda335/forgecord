export interface TranslationRecord {
  langConfig?: { name?: string; flag?: string; short?: string };
  [key: string]: unknown;
}
