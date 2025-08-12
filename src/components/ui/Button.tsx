import { cn } from '../utils';
import { ButtonHTMLAttributes } from 'react';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn('inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium border hover:shadow-sm transition', className)}
      {...props}
    />
  );
}
