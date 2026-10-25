import * as React from 'react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, glow = false, ...props }, ref) => <motion.div ref={ref} whileHover={{ y: -2 }} whileTap={{ y: 1 }} transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }} className={cn('rounded-2xl border border-border/75 bg-card text-card-foreground shadow-[0_14px_38px_hsl(240_20%_10%/.09),inset_0_1px_0_hsl(var(--foreground)/.025)] transition-[border-color,box-shadow,transform] duration-200', glow && 'hover:border-primary/28 hover:shadow-[0_20px_48px_hsl(240_20%_10%/.15)]', className)} {...(props as any)} />);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h3 ref={ref} className={cn('font-display text-xl font-medium leading-tight tracking-[-.035em]', className)} {...props} />);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
