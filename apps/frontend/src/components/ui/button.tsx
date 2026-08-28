import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 select-none active:scale-[0.99] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-gradient)] text-white shadow-[var(--button-primary-shadow)] hover:shadow-[var(--button-primary-shadow-hover)] hover:brightness-105 border border-indigo-400/30',
        secondary: 'bg-[var(--surface-elevated-card)] text-text-primary border border-border-card shadow-xs hover:bg-surface-hover hover:border-border',
        outline: 'border border-border bg-transparent text-text-primary hover:bg-surface-hover hover:border-border-card shadow-xs',
        ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        link: 'text-accent underline-offset-4 hover:underline p-0 h-auto font-medium',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs rounded-lg',
        lg: 'h-11 px-6 text-base rounded-xl font-semibold',
        icon: 'h-9 w-9 p-0 rounded-lg',
        'icon-sm': 'h-8 w-8 p-0 rounded-lg',
        'icon-lg': 'h-10 w-10 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
        ) : leftIcon ? (
          <span className="mr-2 shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon ? (
          <span className="ml-2 shrink-0">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'icon', ...props }, ref) => {
    return (
      <Button ref={ref} size={size} className={className} {...props}>
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';
