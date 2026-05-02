import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className, glow = false, style }: CardProps) {
  return (
    <div
      className={cn(
        'bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm rounded-lg p-6',
        glow && 'shadow-[0_0_30px_rgba(59,130,246,0.1)]',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

// Made with Bob
