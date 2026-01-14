import crypto from 'crypto';

export function generateId(prefix: string = ''): string {
  return prefix + crypto.randomBytes(8).toString('hex');
}

export function generateMemberId(): string {
  const prefix = 'GM';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function formatDate(date: Date | number | string | null | undefined): string {
  if (!date) return 'N/A';
  let d: Date;

  if (typeof date === 'number') {
    d = new Date(date);
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'N/A';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
