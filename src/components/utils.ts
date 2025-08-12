export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Use USD site-wide
export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
