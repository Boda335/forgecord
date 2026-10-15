export type StyleKey =
  | 'successColor' | 'warningColor' | 'infoColor' | 'commandColor' | 'userColor'
  | 'errorColor' | 'highlightColor' | 'accentColor' | 'secondaryColor'
  | 'primaryColor' | 'dividerColor';

export type LogPart = string | [StyleKey, string];
