import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-semibold tracking-[-.01em] ring-offset-background transition-[background,color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0', {
  variants: {
    variant: {
      default: 'border border-primary/25 bg-primary text-primary-foreground shadow-[0_8px_22px_hsl(var(--primary)/.14)] hover:bg-primary/90 hover:shadow-[0_10px_28px_hsl(var(--primary)/.2)]',
      destructive: 'border border-destructive/20 bg-destructive text-destructive-foreground hover:brightness-105',
      outline: 'border border-border/80 bg-card/70 text-foreground hover:border-primary/35 hover:bg-primary/[.045]',
      secondary: 'border border-border/75 bg-secondary text-secondary-foreground hover:border-border hover:bg-secondary/80',
      ghost: 'text-muted-foreground hover:bg-primary/[.055] hover:text-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
      terminal: 'bg-transparent border border-primary text-primary font-mono hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20',
      glow: 'bg-primary text-primary-foreground shadow-[0_10px_28px_hsl(var(--primary)/.2)] hover:shadow-[0_12px_32px_hsl(var(--primary)/.27)]',
      hero: 'gradient-primary text-primary-foreground font-display hover:brightness-105',
      glass: 'glass border-border/75 text-foreground hover:border-primary/30 hover:bg-primary/[.045]',
    },
    size: {
      default: 'h-11 px-4 py-2',
      sm: 'min-h-9 rounded-lg px-3 text-xs',
      lg: 'h-12 rounded-xl px-7',
      xl: 'h-13 rounded-xl px-8 text-base',
      icon: 'h-11 w-11 rounded-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const classNames = cn(buttonVariants({ variant, size, className }));
  if (asChild) return <Slot className={classNames} ref={ref} {...props} />;
  return <motion.button whileHover={props.disabled ? undefined : { y: -1 }} whileTap={props.disabled ? undefined : { y: 1 }} transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }} className={classNames} ref={ref} {...(props as any)} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
