import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // I'll create this helper next

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'outline' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  animate?: boolean;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = 'primary', size = 'md', animate = true, children, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
      glass: 'glass-panel hover:bg-white/10 text-foreground',
      premium: 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50',
      outline: 'border border-border bg-transparent hover:bg-accent text-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground text-foreground',
      icon: 'p-2 rounded-full'
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-6 text-sm',
      lg: 'h-14 px-8 text-base font-bold',
      icon: 'h-10 w-10 px-0'
    };

    const MotionComponent = animate ? motion.button : 'button';

    return (
      <MotionComponent
        ref={ref as any}
        whileHover={animate ? { scale: 1.02, translateY: -2 } : {}}
        whileTap={animate ? { scale: 0.98 } : {}}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
          variants[variant as keyof typeof variants] || variants.primary,
          sizes[size as keyof typeof sizes] || sizes.md,
          className
        )}
        {...(animate ? {} : {})}
        {...(props as any)}
      >
        {children}
      </MotionComponent>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';
