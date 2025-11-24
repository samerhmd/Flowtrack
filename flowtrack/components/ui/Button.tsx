import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

const baseClasses =
  'inline-flex items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600',
  secondary: 'border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 focus:ring-gray-300',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  )
);

Button.displayName = 'Button';