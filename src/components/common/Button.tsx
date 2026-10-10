'use client';

import React from 'react';
import Link from 'next/link';
import { FaSpinner } from 'react-icons/fa';

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
    'bg-secondary hover:bg-secondary-hover active:bg-[#202020] text-white border border-border',
  card:
    'bg-cc-card hover:bg-secondary active:bg-secondary/80 text-cc-text hover:text-white border border-border',
  outline:
    'bg-transparent hover:bg-white/5 active:bg-white/10 text-white border border-border hover:border-white/20',
  ghost:
    'bg-transparent hover:bg-white/5 active:bg-white/10 text-muted-foreground hover:text-white border border-transparent',
  danger:
    'bg-primary/15 hover:bg-primary/25 active:bg-primary/30 text-primary border border-primary/30',
  success:
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-500/40 shadow-xs',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'px-6 py-2.5 text-sm sm:text-base rounded-full gap-2 font-semibold',
  icon: 'p-2 rounded-xl text-xs sm:text-sm justify-center',
  'icon-sm': 'p-1.5 rounded-lg text-xs justify-center',
};

/**
 * Customizable, accessible Button component supporting multiple design system variants,
 * size scales, loading states, icons, and optional Next.js Link navigation.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={() => console.log('clicked')}>
 *   Save Changes
 * </Button>
 *
 * <Button variant="secondary" href="/clips" leftIcon={<FaVideo />}>
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
      'inline-flex items-center justify-center font-semibold select-none transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';

    const pillClass = pill ? 'rounded-full' : '';
    const widthClass = fullWidth ? 'w-full' : '';
    const variantClass = VARIANT_CLASSES[variant];
    const sizeClass = SIZE_CLASSES[size];

    const combinedClassName = [
      baseClasses,
      variantClass,
      sizeClass,
      pillClass,
      widthClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {isLoading ? (
          <FaSpinner className="animate-spin shrink-0" size={size === 'xs' ? 10 : 12} />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
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
