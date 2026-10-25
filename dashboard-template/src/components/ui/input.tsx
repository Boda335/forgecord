import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, type, ...props }, ref) => {
  return <input type={type} className={cn('flex h-11 w-full rounded-xl border border-border/75 bg-background/75 px-4 py-2 text-[15px] text-foreground shadow-[inset_0_1px_3px_hsl(240_20%_10%/.06)] placeholder:text-muted-foreground/75 ring-offset-background transition-[border-color,box-shadow,background] duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring/75 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50', className)} ref={ref} {...props} />;
});
Input.displayName = 'Input';

export { Input };
