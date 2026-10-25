import { Activity } from 'lucide-react';
export function WorkspaceFooter() {
  return <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground"><span>Forgecord Control Center</span><span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-success" />Secure Discord workspace</span></footer>;
}
