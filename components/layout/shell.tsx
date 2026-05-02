import { cn } from '@/lib/utils';

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

export function Shell({ children, className }: ShellProps) {
  return (
    <div className={cn('min-h-screen bg-gray-950', className)}>
      {children}
    </div>
  );
}

// Made with Bob
