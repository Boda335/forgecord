import { useState } from 'react';
import { Check, Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type ColorTheme } from '@/providers/ThemeProvider';

const palettes: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: 'amber', label: 'Amber', swatch: '#f3ac2f' },
  { id: 'violet', label: 'Violet', swatch: '#9b87f5' },
  { id: 'ocean', label: 'Ocean', swatch: '#38a9d6' },
  { id: 'emerald', label: 'Emerald', swatch: '#35b889' },
  { id: 'rose', label: 'Rose', swatch: '#ee7894' },
];

export function ThemeControls() {
  const { mode, setMode, colorTheme, setColorTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const isDark = mode === 'dark' || (mode === 'system' && document.documentElement.dataset.theme === 'dark');
  return <div className="relative flex items-center gap-1">
    <Button variant="ghost" size="icon" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'} onClick={() => setMode(isDark ? 'light' : 'dark')}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
    <Button variant="ghost" size="icon" aria-label="Choose accent color" aria-expanded={open} title="Accent color" onClick={() => setOpen(value => !value)}><Palette className="h-4 w-4" /></Button>
    {open && <div role="dialog" aria-label="Accent color" className="absolute end-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-popover p-2 shadow-xl">
      <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accent color</p>
      {palettes.map(palette => <button key={palette.id} type="button" onClick={() => { setColorTheme(palette.id); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-muted">
        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: palette.swatch }} />{palette.label}
        {colorTheme === palette.id && <Check className="ms-auto h-3.5 w-3.5 text-primary" />}
      </button>)}
    </div>}
  </div>;
}
