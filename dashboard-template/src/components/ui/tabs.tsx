import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => <TabsPrimitive.List ref={ref} className={cn('flex min-h-11 max-w-full items-center justify-start gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-border/75 bg-secondary/70 p-1 text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)} {...props} />);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => <TabsPrimitive.Trigger ref={ref} className={cn('inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 text-[13px] font-medium ring-offset-background transition-colors duration-150 data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', className)} {...props} />);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, children, ...props }, ref) => <TabsPrimitive.Content asChild {...props}><motion.div ref={ref} className={cn('mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>{children}</motion.div></TabsPrimitive.Content>);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
