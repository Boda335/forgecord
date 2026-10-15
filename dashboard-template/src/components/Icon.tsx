import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'activity' | 'arrow' | 'bell' | 'check' | 'bot' | 'chevron' | 'command'
  | 'dashboard' | 'external' | 'globe' | 'help' | 'logout' | 'menu'
  | 'plus' | 'search' | 'server' | 'settings' | 'shield' | 'spark'
  | 'users' | 'x';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

const paths: Record<IconName, ReactNode> = {
  activity: <><path d="M3 12h4l2.2-6 4.2 12L16 12h5" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  bot: <><rect x="4" y="6" width="16" height="13" rx="3" /><path d="M12 3v3M8 12h.01M16 12h.01M8 16h8" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  command: <><path d="M18 8a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 0 3 3 3 0 1 0 0-6h12a3 3 0 1 0 0-3H6a3 3 0 1 0 0 6" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  external: <><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.5 3.4 5.5 3.4 9s-1.2 6.5-3.4 9c-2.2-2.5-3.4-5.5-3.4-9S9.8 5.5 12 3Z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 4.2 1.8c-.9.8-1.9 1.2-1.9 2.7M12 17h.01" /></>,
  logout: <><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" /><path d="m14 8 4 4-4 4M18 12H8" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  server: <><rect x="4" y="4" width="16" height="6" rx="1.5" /><rect x="4" y="14" width="16" height="6" rx="1.5" /><path d="M8 7h.01M8 17h.01" /></>,
  settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19.4 15 .1.1-1.6 2.8-.2-.1a3 3 0 0 0-3.8 1.6v.2h-3.2v-.2a3 3 0 0 0-3.8-1.6l-.2.1-1.6-2.8.1-.1a3 3 0 0 0 0-6l-.1-.1 1.6-2.8.2.1a3 3 0 0 0 3.8-1.6V4h3.2v.2a3 3 0 0 0 3.8 1.6l.2-.1 1.6 2.8-.1.1a3 3 0 0 0 0 6Z" /></>,
  shield: <path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" />,
  spark: <path d="m12 3 1.4 5.1L18 10l-4.6 1.9L12 17l-1.4-5.1L6 10l4.6-1.9L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6Z" />,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 21v-2.1a4 4 0 0 0-3-3.8M16 3.2a4 4 0 0 1 0 7.6" /></>,
  x: <><path d="m6 6 12 12M18 6 6 18" /></>,
};

export function Icon({ name, size = 18, strokeWidth = 1.8, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}
    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} {...props}>{paths[name]}</svg>;
}
