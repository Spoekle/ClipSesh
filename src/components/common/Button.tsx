'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'card'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface BaseButtonProps {
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  /** Size variant controlling padding, font size, and radius */
  size?: ButtonSize;
  /** If true, renders with fully rounded pill corners (rounded-full) */
  pill?: boolean;
  /** If true, expands button to fill 100% of container width */
  fullWidth?: boolean;
  /** Displays a spinning loading indicator and disables user interaction */
  isLoading?: boolean;
  /** Optional icon rendered before the label */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered after the label */
  rightIcon?: React.ReactNode;
  /** If provided, renders as a Next.js Link instead of an HTML button */
  href?: string;
  /** External target when href is provided */
  target?: string;
  /** Rel attribute for security when target="_blank" */
  rel?: string;
}

export type ButtonProps = BaseButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps>;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary hover:bg-primary-hover active:bg-primary-active text-white border border-primary/40 shadow-xs shadow-primary/20',
  secondary:
    'bg-secondary hover:bg-secondary-hover active:bg-[#202020] text-secondary-foreground border border-border shadow-xs',
  card:
    'bg-card hover:bg-secondary active:bg-secondary/80 text-foreground hover:text-white border border-border shadow-xs',
  outline:
    'bg-transparent hover:bg-secondary active:bg-secondary/80 text-foreground border border-border hover:border-border/80',
  ghost:
    'bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground border border-transparent',
  danger:
    'bg-destructive/15 hover:bg-destructive/25 active:bg-destructive/30 text-destructive border border-destructive/30',
  success:
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-500/40 shadow-xs',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'h-10 px-6 py-2.5 text-base rounded-xl gap-2 font-medium',
  icon: 'h-9 w-9 p-0 rounded-lg text-sm justify-center',
  'icon-sm': 'h-7 w-7 p-0 rounded-md text-xs justify-center',
};

/**
 * Customizable, accessible Button component supporting shadcn design system tokens,
 * size scales, loading states, icons, and optional Next.js Link navigation.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={() => console.log('clicked')}>
 *   Save Changes
 * </Button>
 *
 * <Button variant="secondary" href="/clips" leftIcon={<Video />}>
 *   Browse Clips
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      href,
      target,
      rel,
      disabled = false,
      type = 'button',
      className = '',
      children,
      ...restProps
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const baseClasses =
      'inline-flex items-center justify-center font-medium select-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0';

    const pillClass = pill ? 'rounded-full' : '';
    const widthClass = fullWidth ? 'w-full' : '';
    const variantClass = VARIANT_CLASSES[variant];
    const sizeClass = SIZE_CLASSES[size];

    const combinedClassName = cn(
      baseClasses,
      variantClass,
      sizeClass,
      pillClass,
      widthClass,
      className
    );

    const content = (
      <>
        {isLoading ? (
          <Loader2 className="animate-spin shrink-0 size-4" />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex items-center [&_svg]:size-4">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0 inline-flex items-center [&_svg]:size-4">{rightIcon}</span>
        )}
      </>
    );

    if (href && !isDisabled) {
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      const safeRel = isExternal && target === '_blank' ? (rel ?? 'noopener noreferrer') : rel;

      return (
        <Link
          href={href}
          target={target}
          rel={safeRel}
          className={combinedClassName}
          aria-disabled={isDisabled}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={combinedClassName}
        {...restProps}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
