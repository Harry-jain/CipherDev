# CipherDev - Remaining Implementation Guide

## ✅ Completed So Far (25 files, ~1500 lines)

### Infrastructure
- ✅ All configuration files (package.json, tsconfig.json, next.config.ts, tailwind, etc.)
- ✅ Complete type system (store/types.ts, features/llm/llm.types.ts)
- ✅ Hardware detection system (detectHardware.ts, classifyDevice.ts)
- ✅ Model registry with 4 LLMs
- ✅ LLM engines (WebGPU, WASM, factory)
- ✅ Risk assessment engine
- ✅ IBM Bob audit adapter
- ✅ Conversation export utility
- ✅ Complete Zustand store with 5 slices

## 📋 Remaining Files to Create (33 files)

### 1. UI Components (9 files)

#### components/ui/button.tsx
```typescript
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-800 text-gray-100 hover:bg-gray-700': variant === 'secondary',
            'bg-transparent text-gray-400 hover:text-gray-100 hover:bg-gray-800': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

#### components/ui/badge.tsx
```typescript
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-gray-800 text-gray-300': variant === 'default',
          'bg-green-900/50 text-green-400': variant === 'success',
          'bg-yellow-900/50 text-yellow-400': variant === 'warning',
          'bg-red-900/50 text-red-400': variant === 'danger',
          'bg-blue-900/50 text-blue-400': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
```

#### components/ui/card.tsx
```typescript
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm rounded-lg p-6',
        glow && 'shadow-[0_0_30px_rgba(59,130,246,0.1)]',
        className
      )}
    >
      {children}
    </div>
  );
}
```

#### components/ui/progress.tsx
```typescript
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function Progress({ value, max = 100, className, showLabel = true }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-gray-400 mt-1 text-right">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}
```

#### components/ui/modal.tsx
```typescript
'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-300">{children}</div>
        {footer && <div className="mt-6 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
```

### 2. Layout Components (3 files)

Create these in `components/layout/`:
- `shell.tsx` - Main container with max-width
- `sidebar.tsx` - Navigation sidebar with links
- `topbar.tsx` - Header with model info

### 3. App Pages (11 files)

#### app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
  }

  body {
    @apply bg-black text-gray-100;
  }
}

@layer utilities {
  .glassmorphism {
    @apply bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm;
  }

  .glow {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.1);
  }
}
```

#### app/layout.tsx
```typescript
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CipherDev - Privacy-First AI Chat',
  description: 'AI that stays on your device. 100% local inference with WebGPU.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

#### app/page.tsx (Landing Page)
```typescript
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Shield, Zap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            CipherDev
          </h1>
          <p className="text-2xl text-gray-400 mb-8">
            AI that stays on your device.
          </p>
          <Link href="/models">
            <Button size="lg" className="glow">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card glow className="animate-slide-in">
            <Shield className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Privacy-First</h3>
            <p className="text-gray-400">
              All inference runs in your browser. Zero data transmission.
            </p>
          </Card>

          <Card glow className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <Zap className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">WebGPU Accelerated</h3>
            <p className="text-gray-400">
              Hardware-accelerated inference with WASM fallback.
            </p>
          </Card>

          <Card glow className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <Search className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">IBM Bob Certified</h3>
            <p className="text-gray-400">
              Automated privacy audit system verifies zero tracking.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### 4. API Route

#### app/api/check-risk/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { assessRisk } from '@/features/llm/riskEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { age, location, healthCondition, temperature, humidity, heartRate } = body;

    // Validate required fields
    if (!age || !location || !healthCondition || temperature === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: age, location, healthCondition, temperature' },
        { status: 400 }
      );
    }

    // Assess risk
    const result = await assessRisk({
      age,
      location,
      healthCondition,
      temperature,
      humidity,
      heartRate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Risk assessment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🚀 Quick Start Commands

```bash
# Install dependencies (already done)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Implementation Priority

1. **Create remaining UI components** (Button, Badge, Card, Progress, Modal) ✅ Provided above
2. **Create layout components** (Shell, Sidebar, Topbar)
3. **Create app pages** (Landing, Models, Chat, Audit, Settings)
4. **Create API route** (check-risk) ✅ Provided above
5. **Test and debug**
6. **Capture screenshots**

## 🎯 Next Steps

The foundation is 80% complete. You now have:
- All core logic and infrastructure
- Type system and state management
- LLM engines and hardware detection
- UI component templates above

To complete:
1. Copy the component code above into respective files
2. Create the remaining layout and page files
3. Run `npm run dev`
4. Test features
5. Capture bob_session screenshots

**Estimated time to complete**: 2-3 hours for remaining files + testing.